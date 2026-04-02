package com.camunda.start.update;

import com.camunda.start.update.dto.VersionsDto;
import com.camunda.start.update.dto.VersionsWrapperDto;
import org.apache.commons.io.IOUtils;
import org.apache.maven.artifact.versioning.ComparableVersion;
import org.springframework.beans.factory.annotation.Autowired;
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
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.regex.Matcher;

import static com.camunda.start.update.Constants.IGNORED_VERSION_TAGS;
import static com.camunda.start.update.Constants.REGEX_PATTERN_VERSION;
import static com.camunda.start.update.Constants.URL_MAVEN_C8_METADATA;
import static com.camunda.start.update.Constants.URL_MAVEN_C8_METADATA_MD5;
import static com.camunda.start.update.Constants.URL_MAVEN_C8_POM;
import static com.camunda.start.update.Constants.XPATH_VERSIONS;

@Component
public class VersionUpdater {

    protected Map<String, ComparableVersion> cachedComparableVersions = new HashMap<>();

    protected VersionsWrapperDto versionsWrapper;

    @Autowired
    protected NpmVersionResolver npmVersionResolver;

    @Scheduled(cron = "0 0 * * * *")
    public void updateVersions() {
        boolean npmChanged = npmVersionResolver.updateVersions();
        String fetchedChecksum = fetchChecksum();

        if (!fetchedChecksum.equals(readChecksum())) {
            Set<String> fetchedVersions = fetchVersions();

            removeIgnoredVersions(fetchedVersions);

            List<ComparableVersion> latestVersions = 
                new ArrayList<>(getLatestVersions(fetchedVersions));
            
            Collections.sort(latestVersions);
            Collections.reverse(latestVersions);

            versionsWrapper = new VersionsWrapperDto();
            versionsWrapper.setVersions(getLatestVersions(latestVersions));
            versionsWrapper.setChecksum(fetchedChecksum);
        } else if (npmChanged && versionsWrapper != null && versionsWrapper.getVersions() != null) {
            VersionsDto versions = versionsWrapper.getVersions();
            versions.setNpmSdkVersion(npmVersionResolver.getLatestSdkVersion());
            versions.setNpmProcessTestVersion(npmVersionResolver.getLatestProcessTestVersion());
        }
    }

    protected void removeIgnoredVersions(Set<String> fetchedVersions) {
        fetchedVersions.removeIf(version ->
            IGNORED_VERSION_TAGS.stream().anyMatch(version::contains)
        );
    }

    protected Collection<ComparableVersion> getLatestVersions(Set<String> fetchedVersions) {
        // clear previously cached versions
        cachedComparableVersions.clear();

        Map<String, ComparableVersion> latestVersionsMap = new HashMap<>();

        fetchedVersions.forEach(fetchedVersion -> {
            Matcher versionMatcher = REGEX_PATTERN_VERSION.matcher(fetchedVersion);
            if (versionMatcher.find()) {
                String minorVersion = versionMatcher.group(1) + "." + versionMatcher.group(2);
                ComparableVersion entireVersion = latestVersionsMap.get(minorVersion);

                ComparableVersion comparableVersion =
                    getCachedComparableVersion(fetchedVersion);

                if (entireVersion == null) {
                    latestVersionsMap.put(minorVersion, comparableVersion);

                } else if (entireVersion.compareTo(comparableVersion) < 0) {
                    latestVersionsMap.put(minorVersion, comparableVersion);

                }
            }
        });

        return latestVersionsMap.values();
    }

    protected VersionsDto getLatestVersions(List<ComparableVersion> majorMinorVersions) {
        if (majorMinorVersions.isEmpty()) {
            return null;
        }

        String npmSdkVersion = npmVersionResolver.getLatestSdkVersion();
        String npmProcessTestVersion = npmVersionResolver.getLatestProcessTestVersion();

        String version = majorMinorVersions.get(0).toString();

        VersionsDto versionInfo = new VersionsDto();
        versionInfo.setCamundaVersion(version);
        versionInfo.setNpmSdkVersion(npmSdkVersion);
        versionInfo.setNpmProcessTestVersion(npmProcessTestVersion);

        String url = URL_MAVEN_C8_POM.replace("{version}", version);
        InputStream pom = getInputStreamByUrl(url);
        Document pomDocument = createPomDocument(pom);

        versionInfo.setSpringBootVersion(resolveSpringBootVersion(pomDocument, version));

        return versionInfo;
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

    protected String resolveSpringBootVersion(Document pomDocument, String camundaVersion) {
        String[] xPaths = new String[] {
            // explicit spring-boot dependency version
            "//*[local-name()='dependency']" +
                "[*[local-name()='groupId']='org.springframework.boot']" +
                "[*[local-name()='artifactId']='spring-boot']" +
                "/*[local-name()='version']"
        };

        for (String xPath : xPaths) {
            String resolved = getVersion(pomDocument, xPath);
            if (!resolved.isBlank()) {
                return resolved;
            }
        }

        throw new IllegalStateException("Could not resolve Spring Boot version for Camunda starter version " + camundaVersion);
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
        InputStream metadataInputStream = getInputStreamByUrl(URL_MAVEN_C8_METADATA);
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
        return versionsWrapper == null ? null : versionsWrapper.getChecksum();
    }

    protected String fetchChecksum() {
        try {
            return IOUtils.toString(getInputStreamByUrl(URL_MAVEN_C8_METADATA_MD5),
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

    public VersionsWrapperDto getVersionsWrapper() {
        updateVersions();
        return versionsWrapper;
    }

}