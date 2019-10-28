package com.camunda.start.update;

import com.camunda.start.update.dto.StarterVersionDto;
import com.camunda.start.update.dto.StarterVersionWrapperDto;
import org.apache.commons.io.IOUtils;
import org.apache.maven.artifact.versioning.ComparableVersion;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.w3c.dom.Document;
import org.w3c.dom.NodeList;
import org.xml.sax.SAXException;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathExpressionException;
import javax.xml.xpath.XPathFactory;
import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLConnection;
import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.regex.Matcher;

import static com.camunda.start.update.Constants.IGNORED_MINOR_VERSIONS;
import static com.camunda.start.update.Constants.IGNORED_VERSION_TAGS;
import static com.camunda.start.update.Constants.REGEX_PATTERN_VERSION;
import static com.camunda.start.update.Constants.URL_MAVEN_METADATA;
import static com.camunda.start.update.Constants.URL_MAVEN_METADATA_MD5;
import static com.camunda.start.update.Constants.URL_MAVEN_PROJECT_POM;
import static com.camunda.start.update.Constants.XPATH_VERSIONS;

@Component
public class VersionUpdater {

    protected final Logger LOGGER = LoggerFactory.getLogger(VersionUpdater.class);

    protected Map<String, ComparableVersion> cachedComparableVersions = new HashMap<>();

    protected StarterVersionWrapperDto starterVersionWrapper;

    @Scheduled(cron = "0 * * * * *")
    public void updateVersions() {
        String fetchedChecksum = fetchChecksum();

        if (!fetchedChecksum.equals(readChecksum())) {
            Set<String> fetchedVersions = fetchVersions();

            removeIgnoredVersions(fetchedVersions);

            List<ComparableVersion> latestVersions = 
                new ArrayList<>(getLatestVersions(fetchedVersions));
            
            Collections.sort(latestVersions);
            Collections.reverse(latestVersions);

            starterVersionWrapper = new StarterVersionWrapperDto();
            starterVersionWrapper.setStarterVersions(getLatestStarterVersions(latestVersions));
            starterVersionWrapper.setChecksum(fetchedChecksum);
        }
    }

    protected void removeIgnoredVersions(Set<String> fetchedVersions) {
        Iterator<String> iterator = fetchedVersions.iterator();
        while (iterator.hasNext()) {
            IGNORED_VERSION_TAGS.stream()
                .filter(iterator.next()::contains)
                .forEach(ignoredVersionTag -> iterator.remove());
        }
    }

    protected Collection<ComparableVersion> getLatestVersions(Set<String> fetchedVersions) {
        // clear previously cached versions
        cachedComparableVersions.clear();

        Map<String, ComparableVersion> latestVersionsMap = new HashMap<>();

        fetchedVersions.forEach(fetchedVersion -> {
            Matcher versionMatcher = REGEX_PATTERN_VERSION.matcher(fetchedVersion);
            if (versionMatcher.find()) {
                String minorVersion = versionMatcher.group(1) + "." + versionMatcher.group(2);
                if (!IGNORED_MINOR_VERSIONS.contains(minorVersion)) {
                    ComparableVersion entireVersion = latestVersionsMap.get(minorVersion);

                    ComparableVersion comparableVersion =
                        getCachedComparableVersion(fetchedVersion);

                    if (entireVersion == null) {
                        latestVersionsMap.put(minorVersion, comparableVersion);

                    } else if (entireVersion.compareTo(comparableVersion) < 0) {
                        latestVersionsMap.put(minorVersion, comparableVersion);

                    }
                }
            }
        });

        return latestVersionsMap.values();
    }

    protected List<StarterVersionDto> getLatestStarterVersions(List<ComparableVersion> majorMinorVersions) {
        List<StarterVersionDto> starterVersions = new ArrayList<>();
        
        for (int i = 0; i < 3; i++) {
            String version = majorMinorVersions.get(i)
                .getCanonical();

            String url = URL_MAVEN_PROJECT_POM.replace("{version}", version);

            InputStream pom = getInputStreamByUrl(url);
            Document pomDocument = createPomDocument(pom);

            String springBootVersion = getVersion(pomDocument,
                "/project/properties/spring-boot.version");

            String camundaVersion = getVersion(pomDocument,
                "/project/properties/camunda.version");;

            StarterVersionDto starterVersion = new StarterVersionDto();
            starterVersion.setStarterVersion(version);
            starterVersion.setCamundaVersion(camundaVersion);
            starterVersion.setSpringBootVersion(springBootVersion);

            starterVersions.add(starterVersion);
        }
        
        return starterVersions;
    }

    protected String getVersion(Document documentByInputStream, String xPath) {
        try {
            return (String) XPathFactory.newInstance()
                .newXPath()
                .compile(xPath)
                .evaluate(documentByInputStream, XPathConstants.STRING);

        } catch (XPathExpressionException e) {
            throw new RuntimeException(e);
        }
    }

    protected ComparableVersion getCachedComparableVersion(String fetchedVersion) {
        ComparableVersion cachedVersion = cachedComparableVersions.get(fetchedVersion);

        if (cachedVersion == null) {
            ComparableVersion comparableVersion = new ComparableVersion(fetchedVersion);

            cachedComparableVersions.put(fetchedVersion, comparableVersion);

            return comparableVersion;

        } else {
            return cachedVersion;

        }
    }

    protected Set<String> fetchVersions() {
        InputStream metadataInputStream = getInputStreamByUrl(URL_MAVEN_METADATA);
        Document xmlDocument = createPomDocument(metadataInputStream);

        NodeList nodeList = null;
        try {
            nodeList = (NodeList) XPathFactory.newInstance()
                .newXPath()
                .compile(XPATH_VERSIONS)
                .evaluate(xmlDocument, XPathConstants.NODESET);
        } catch (XPathExpressionException e) {
            throw new RuntimeException(e);
        }


        Set<String> fetchedVersions = new HashSet<>();
        for (int i = 0; i < nodeList.getLength(); i++) {
            fetchedVersions.add(nodeList.item(i).getTextContent());
        }

        fetchedVersions.remove(null);

        return fetchedVersions;
    }

    protected String readChecksum() {
        return starterVersionWrapper == null ? null : starterVersionWrapper.getChecksum();
    }

    protected String fetchChecksum() {
        try {
            return IOUtils.toString(getInputStreamByUrl(URL_MAVEN_METADATA_MD5),
                Charset.defaultCharset());
        } catch (IOException e) {
            throw new RuntimeException(e);

        }
    }

    protected Document createPomDocument(InputStream inputStream) {
        DocumentBuilderFactory builderFactory = DocumentBuilderFactory.newInstance();
        DocumentBuilder builder = null;
        try {
            builder = builderFactory.newDocumentBuilder();
        } catch (ParserConfigurationException e) {
            throw new RuntimeException(e);
        }

        try {
            return Objects.requireNonNull(builder).parse(inputStream);
        } catch (SAXException | IOException e) {
            throw new RuntimeException(e);
        }
    }

    protected InputStream getInputStreamByUrl(String url) {
        URL metadata = null;
        try {
            metadata = new URL(url);
        } catch (MalformedURLException e) {
            throw new RuntimeException(e);
        }

        URLConnection urlConnection = null;
        try {
            urlConnection = metadata.openConnection();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }

        try {
            return urlConnection.getInputStream();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    public StarterVersionWrapperDto getStarterVersionWrapper() {
        updateVersions();
        return starterVersionWrapper;
    }

}