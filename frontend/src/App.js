import React, { useState, useEffect, useRef } from "react";
import { keyframes } from "@emotion/react";
import BpmnViewer from "bpmn-js/lib/Viewer";

import {
  Tooltip,
  Link,
  Box,
  Divider,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  List,
  IconButton,
  Dialog,
  Button,
  Typography,
  Toolbar,
  AppBar,
  Paper,
  Grid2 as Grid,
  MenuItem,
  Select,
  InputLabel,
  Checkbox,
  FormControlLabel,
  FormGroup,
  FormControl,
  Container,
  TextField,
  CircularProgress,
  ButtonGroup,
  Chip,
} from "@mui/material";

import {
  Close,
  BookOutlined,
  Download,
  FolderOpen,
  InsertDriveFileOutlined,
  Code,
  AccountTree,
  ContentCopy,
  Check,
} from "@mui/icons-material";

import SyntaxHighlighter from "react-syntax-highlighter";
import a11yLight from "react-syntax-highlighter/dist/esm/styles/hljs/a11y-light";

const headerGradientShift = keyframes`
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const downloadFile = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const initialFormData = {
  artifact: { value: "my-project" },
  group: { value: "com.example.workflow" },
  javaVersion: { value: "21" },
};

const initialModules = {
  "process-test": false,
};

const GROUP_REGEX = /^[a-z_]+(\.[a-z_][a-z0-9_]*)*$/i;

const validateArtifact = (value) => ({ value, error: !value });
const validateGroup = (value) => ({ value, error: !GROUP_REGEX.test(value) });
const validateJavaVersion = (value) => {
  const numericValue = Number(value);
  return { value, error: !(numericValue >= 17 && numericValue <= 21) };
};

const mapVersions = (version, release) => {
  if (release && release.camundaVersion === version) {
    return {
      camundaVersion: { value: version },
      springBootVersion: { value: release.springBootVersion },
      npmSdkVersion: { value: release.npmSdkVersion },
      npmProcessTestVersion: { value: release.npmProcessTestVersion },
    };
  }
};

const getModuleNames = (modules) => {
  return Object.keys(modules).filter((name) => modules[name]);
};

const getPayload = (formData) =>
  Object.entries(formData).reduce((acc, [key, value]) => {
    if (key !== "springBootVersion" && key !== "npmSdkVersion" && key !== "npmProcessTestVersion" && key !== "versions") {
      acc[key] = value.value;
    }
    return acc;
  }, {});

const isBpmnFile = (fileKey) => fileKey?.endsWith("process.bpmn");

const getFileList = (language, formData, modules) => {
  const artifact = formData.artifact?.value || "my-project";
  const group = formData.group?.value || "com.example.workflow";
  const javaPath =
    artifact + "/src/main/java/" + group.replace(/\./g, "/") + "/";

  if (language === "java") {
    const files = [
      {
        key: "java_main_pom.xml",
        filename: "pom.xml",
        type: "xml",
        path: artifact + "/",
      },
      {
        key: "java_main_application.properties",
        filename: "application.properties",
        type: "properties",
        path: artifact + "/src/main/resources/",
      },
      {
        key: "java_main_process.bpmn",
        filename: "process.bpmn",
        type: "xml",
        path: artifact + "/src/main/resources/",
      },
      {
        key: "java_main_ProcessOrderApplication.java",
        filename: "ProcessOrderApplication.java",
        type: "java",
        path: javaPath,
      },
      {
        key: "java_main_CheckInventoryWorker.java",
        filename: "CheckInventoryWorker.java",
        type: "java",
        path: javaPath,
      },
      {
        key: "java_main_ChargePaymentWorker.java",
        filename: "ChargePaymentWorker.java",
        type: "java",
        path: javaPath,
      },
      {
        key: "java_main_ShipItemsWorker.java",
        filename: "ShipItemsWorker.java",
        type: "java",
        path: javaPath,
      },
    ];
    if (modules["process-test"]) {
      files.push({
        key: "java_test_ProcessOrderApplicationTests.java",
        filename: "ProcessOrderApplicationTests.java",
        type: "java",
        path:
          artifact +
          "/src/test/java/" +
          group.replace(/\./g, "/") +
          "/",
      });
      files.push({
        key: "java_test_application.properties",
        filename: "application.properties",
        type: "properties",
        path: artifact + "/src/test/resources/",
      });
    }
    return files;
  } else {
    const files = [
      {
        key: "nodejs_main_package.json",
        filename: "package.json",
        type: "json",
        path: artifact + "/",
      },
      {
        key: "nodejs_main_tsconfig.json",
        filename: "tsconfig.json",
        type: "json",
        path: artifact + "/",
      },
      {
        key: "nodejs_main_index.ts",
        filename: "index.ts",
        type: "typescript",
        path: artifact + "/source/",
      },
      {
        key: "nodejs_main_workers.ts",
        filename: "workers.ts",
        type: "typescript",
        path: artifact + "/source/",
      },
      {
        key: "nodejs_main_process.bpmn",
        filename: "process.bpmn",
        type: "xml",
        path: artifact + "/source/resources/",
      },
    ];
    if (modules["process-test"]) {
      files.push({
        key: "nodejs_test_process.test.ts",
        filename: "process.test.ts",
        type: "typescript",
        path: artifact + "/source/test/",
      });
      files.push({
        key: "nodejs_test_jest.config.js",
        filename: "jest.config.js",
        type: "javascript",
        path: artifact + "/source/test/",
      });
    }
    return files;
  }
};

const App = () => {
  const [formData, setFormData] = useState({});
  const [modules, setModules] = useState(initialModules);
  const [language, setLanguage] = useState("java");
  const [error, setError] = useState(false);
  const [openExplorer, setOpenExplorer] = useState(false);
  const [sourceCode, setSourceCode] = useState();
  const [selectedFile, setSelectedFile] = useState(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const [copiedCommand, setCopiedCommand] = useState(null);
  const [viewMode, setViewMode] = useState("diagram");
  const bpmnContainerRef = useRef(null);
  const bpmnViewerRef = useRef(null);
  const activeRequestRef = useRef(null);
  const artifactName = formData.artifact?.value || initialFormData.artifact.value;
  const camundaVersion = formData.camundaVersion?.value || "latest";
  const processFilePath =
    language === "java"
      ? `./src/main/resources/process.bpmn`
      : `./source/resources/process.bpmn`;
  const codeBlockSx = {
    m: 0,
    p: 1.1,
    pt: 1.1,
    pr: 4.5,
    minHeight: { xs: 44, sm: 46 },
    display: "flex",
    alignItems: "center",
    borderRadius: 1.25,
    fontSize: { xs: "0.80rem", sm: "0.85rem" },
    fontWeight: 600,
    lineHeight: 1.6,
    letterSpacing: "0.01em",
    overflowX: "auto",
    fontFamily: '"IBM Plex Mono", "Courier New", Courier, monospace',
    backgroundColor: "#000",
    color: "#f8fafc",
  };
  const stepHeadingSx = {
    display: "block",
    width: "100%",
    pb: 0.75,
    mb: 1.35,
    borderBottom: "1px solid",
    borderColor: "divider",
    fontWeight: 700,
    fontSize: { xs: "1rem", sm: "1.08rem" },
    lineHeight: 1.5,
    letterSpacing: "0.01em",
  };
  const step2FieldSx = {
    "& .MuiInputBase-root": {
      borderRadius: 1.1,
    },
  };

  const copyCommand = async (command, key) => {
    const normalizedCommand = command
      .split("\n")
      .map((line) => line.replace(/^\s*\$\s?/, ""))
      .join("\n");

    try {
      await navigator.clipboard.writeText(normalizedCommand);
      setCopiedCommand(key);
      window.setTimeout(() => {
        setCopiedCommand((current) => (current === key ? null : current));
      }, 1500);
    } catch (e) {
      // Ignore clipboard errors silently; command remains selectable in the UI.
    }
  };

  const renderCommandBlock = (command, key) => (
    <Box sx={{ position: "relative" }}>
      <Tooltip title={copiedCommand === key ? "Copied" : "Copy command"}>
        <IconButton
          size="small"
          onClick={() => copyCommand(command, key)}
          aria-label={`copy-${key}`}
          sx={{
            position: "absolute",
            top: 10,
            right: 8,
            zIndex: 1,
            bgcolor: "transparent",
            color: "white",
            "&:hover": {
              bgcolor: "rgba(252, 93, 13, 0.12)",
            },
          }}
        >
          {copiedCommand === key ? <Check fontSize="inherit" /> : <ContentCopy fontSize="inherit" />}
        </IconButton>
      </Tooltip>
      <Box component="pre" sx={codeBlockSx}>
        {command}
      </Box>
    </Box>
  );

  // Helper to build URL parameters from current state
  const buildUrlParams = () => {
    const params = new URLSearchParams();
    if (language) params.set("language", language);
    if (formData.artifact?.value) params.set("artifact", formData.artifact.value);
    if (formData.group?.value && language === "java") params.set("group", formData.group.value);
    if (formData.javaVersion?.value && language === "java") params.set("javaVersion", formData.javaVersion.value);
    if (formData.camundaVersion?.value) params.set("camundaVersion", formData.camundaVersion.value);
    if (modules["process-test"]) params.set("processTest", "true");
    return params.toString();
  };

  // Helper to update URL without navigation
  const updateUrl = () => {
    const queryString = buildUrlParams();
    const newUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;
    window.history.replaceState({}, "", newUrl);
  };

  // Helper to parse URL parameters and apply them
  const applyUrlParams = (versions) => {
    if (!versions) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const rawLanguage = params.get("language");
    const urlLanguage = rawLanguage === "nodejs" || rawLanguage === "java" ? rawLanguage : "java";
    const urlArtifact = params.get("artifact");
    const urlGroup = params.get("group");
    const urlJavaVersion = params.get("javaVersion");
    const urlCamundaVersion = params.get("camundaVersion");
    const urlProcessTest = params.get("processTest") === "true";

    setLanguage(urlLanguage);

    // Apply version and derived values.
    const fallbackCamundaVersion = versions.camundaVersion;
    const camundaVersionToApply = urlCamundaVersion || fallbackCamundaVersion;
    const versionMapping =
      mapVersions(camundaVersionToApply, versions) ||
      mapVersions(fallbackCamundaVersion, versions);

    const artifactValue = urlArtifact || initialFormData.artifact.value;
    const groupValue = urlGroup || initialFormData.group.value;
    const javaVersionValue = urlJavaVersion || initialFormData.javaVersion.value;

    const newFormData = {
      ...versionMapping,
      versions: { value: versions },
      artifact: validateArtifact(artifactValue),
      group:
        urlLanguage === "java"
          ? validateGroup(groupValue)
          : { value: groupValue, error: false },
      javaVersion:
        urlLanguage === "java"
          ? validateJavaVersion(javaVersionValue)
          : { value: javaVersionValue, error: false },
    };

    setFormData(newFormData);
    setModules({ "process-test": urlProcessTest });
  };
  useEffect(() => {
    fetch("./versions.json").then((response) => {
      if (response.status === 200) {
        response.json().then(({ versions }) => {
          applyUrlParams(versions);
        });
      }
    });

    const handler = (e) => {
      e.preventDefault();
      e.returnValue = true;
    };

    window.addEventListener("beforeunload", handler);
    return () => {
      window.removeEventListener("beforeunload", handler);
    };
  }, []);

  // Update URL whenever form data, language, or modules change
  useEffect(() => {
    if (Object.keys(formData).length > 0) {
      updateUrl();
    }
  }, [formData, language, modules]);

  useEffect(() => {
    const relevantFields = ["artifact", ...(language === "java" ? ["group", "javaVersion"] : [])];
    setError(relevantFields.some((field) => formData[field]?.error));
  }, [formData, language]);

  useEffect(() => {
    if (!(
      sourceCode?.type === "xml" &&
      isBpmnFile(sourceCode?.fileKey) &&
      viewMode === "diagram" &&
      bpmnContainerRef.current
    )) {
      return;
    }

    if (bpmnViewerRef.current) {
      bpmnViewerRef.current.destroy();
      bpmnViewerRef.current = null;
    }

    const viewer = new BpmnViewer({ container: bpmnContainerRef.current });
    bpmnViewerRef.current = viewer;

    viewer
      .importXML(sourceCode.text)
      .then(() => {
        const canvas = viewer.get("canvas");
        canvas.resized();
        canvas.zoom("fit-viewport", "auto");
      })
      .catch((err) => {
        console.error("Failed to import BPMN XML:", err);
      });

    return () => {
      if (bpmnViewerRef.current === viewer) {
        viewer.destroy();
        bpmnViewerRef.current = null;
      }
    };
  }, [sourceCode, viewMode, openExplorer]);

  const clearPreview = () => {
    if (bpmnViewerRef.current) {
      bpmnViewerRef.current.destroy();
      bpmnViewerRef.current = null;
    }
    setSourceCode();
  };

  const handleClose = () => {
    clearPreview();
    activeRequestRef.current = null;
    setSelectedFile(null);
    setOpenExplorer(false);
    setViewMode("diagram");
    setLoadingFile(false);
  };

  const changeModules = (module) => {
    setModules({ ...modules, [module.name]: module.checked });
  };

  const generateProject = () => {
    const payload = getPayload(formData);
    fetch("./download", {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...payload,
        language,
        modules: getModuleNames(modules),
      }),
    }).then((response) => {
      if (response.status === 200) {
        response
          .blob()
          .then((blob) => downloadFile(blob, `${formData.artifact.value}.zip`));
      }
    });
  };

  const highlight = (fileKey, type) => {
    // Avoid duplicate requests if the user clicks the currently displayed file again.
    if (
      fileKey === selectedFile &&
      (loadingFile || sourceCode?.fileKey === fileKey)
    ) {
      return;
    }

    // Switching files should immediately remove old preview (including BPMN viewer).
    if (fileKey !== sourceCode?.fileKey) {
      clearPreview();
    }

    activeRequestRef.current = fileKey;
    setSelectedFile(fileKey);
    setViewMode(isBpmnFile(fileKey) ? "diagram" : "xml");
    setLoadingFile(true);
    const payload = getPayload(formData);
    fetch(`./show/${fileKey}`, {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...payload,
        language,
        modules: getModuleNames(modules),
      }),
    }).then((response) => {
      if (response.status === 200) {
        response.text().then((text) => {
          if (activeRequestRef.current !== fileKey) {
            return;
          }
          setSourceCode({ text, type, fileKey });
          setLoadingFile(false);
        });
      } else if (activeRequestRef.current === fileKey) {
        setLoadingFile(false);
      }
    }).catch(() => {
      if (activeRequestRef.current === fileKey) {
        setLoadingFile(false);
      }
    });
  };

  const handleChangeGroup = (newGroup) => {
    const { group, ...rest } = formData;
    setFormData({
      group: validateGroup(newGroup),
      ...rest,
    });
  };

  return (
    <div className="App">
      <AppBar position="static" color="transparent" elevation={0}>
        <Toolbar
          sx={{
            background:
              "linear-gradient(135deg, #000, #280892, #000, #280892)",
            backgroundSize: "400% 400%",
            animation: `${headerGradientShift} 12s ease infinite`,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <img src="./logo.svg" width={110} alt="Camunda" />
            <Typography
              sx={{
                color: "common.white",
                fontWeight: 200,
                fontSize: { xs: "1.1rem", sm: "2rem" },
                letterSpacing: "0.03em",
              }}
            >
              Initializr
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      <Container
        sx={{
          minHeight: "calc(100vh - 128px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          py: { xs: 1.5, sm: 2.5 },
          maxWidth: "700px !important",
        }}
      >
        <Paper
          sx={{
            p: { xs: 2.5, sm: 4 },
            borderRadius: 3,
            width: "100%"
          }}
        >
          {Object.keys(formData).length === 0 ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "500px",
                gap: 2,
              }}
            >
              <CircularProgress size={48} />
              <Typography color="text.secondary">Loading…</Typography>
            </Box>
          ) : (
            <>
              <Typography variant="subtitle2" sx={stepHeadingSx}>
                Step 1: Install and start
              </Typography>

              <Container disableGutters sx={{ m: "20px 0 30px 0" }}>
              <Box sx={{ display: "grid", gap: 1 }}>
                {renderCommandBlock(`$ npm install -g @camunda8/cli`, "step1-install")}
                {renderCommandBlock(`$ c8ctl cluster start ${camundaVersion}`, "step1-start")}
              </Box>
              </Container>

              <Typography variant="subtitle2" sx={{ ...stepHeadingSx, mt: { xs: 2.25, sm: 2.75 } }}>
                Step 2: Initialize your project
              </Typography>

              <Container disableGutters sx={{ m: "20px 0 30px 0" }}>
              <Grid container spacing={{ xs: 2, sm: 2.25 }} sx={{ mt: 0.4 }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth size="small" id="language" sx={step2FieldSx}>
                    <InputLabel htmlFor="language">Language</InputLabel>
                    <Select
                      label="Language"
                      value={language}
                      onChange={(e) => {
                        setLanguage(e.target.value);
                        setModules(initialModules);
                      }}
                    >
                      <MenuItem value="java">Java</MenuItem>
                      <MenuItem value="nodejs">Node.js</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl id="camunda-version" fullWidth size="small" sx={step2FieldSx}>
                    <InputLabel htmlFor="camunda-version">Version</InputLabel>
                    <Select
                      label="Version"
                      value={formData.camundaVersion.value}
                      onChange={(e) => {
                        const {
                          camundaVersion,
                          springBootVersion,
                          ...rest
                        } = formData;
                        setFormData({
                          ...mapVersions(
                            e.target.value,
                            formData.versions.value
                          ),
                          ...rest,
                        });
                      }}
                    >
                      <MenuItem value={formData.versions.value.camundaVersion}>
                        {formData.versions.value.camundaVersion}
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {language === "java" && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      error={formData.group.error}
                      label="Group"
                      size="small"
                      fullWidth
                      sx={step2FieldSx}
                      id="group"
                      value={formData.group.value}
                      onInput={(e) => handleChangeGroup(e.target.value)}
                    />
                  </Grid>
                )}

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    error={formData.artifact.error}
                    id="artifact"
                    label={language === "java" ? "Artifact" : "Package Name"}
                    size="small"
                    fullWidth
                    sx={step2FieldSx}
                    value={formData.artifact.value}
                    onInput={(e) => {
                      const newArtifact = e.target.value;
                      const { artifact, ...rest } = formData;
                      setFormData({
                        artifact: validateArtifact(newArtifact),
                        ...rest,
                      });
                    }}
                  />
                </Grid>

                {language === "java" && (
                  <>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        id="spring-boot-version"
                        label="Spring Boot Version"
                        size="small"
                        fullWidth
                        sx={step2FieldSx}
                        disabled
                        value={formData.springBootVersion.value}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        error={formData.javaVersion.error}
                        id="java-version"
                        label="Java Version"
                        size="small"
                        fullWidth
                        sx={step2FieldSx}
                        type="number"
                        value={formData.javaVersion.value}
                        onInput={(e) => {
                          const newJavaVersion = e.target.value;
                          const { javaVersion, ...rest } = formData;
                          setFormData({
                            javaVersion: validateJavaVersion(newJavaVersion),
                            ...rest,
                          });
                        }}
                      />
                    </Grid>
                  </>
                )}

                {language === "nodejs" && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      id="nodejs-sdk-version"
                      label="@camunda8/sdk Version"
                      size="small"
                      fullWidth
                      sx={step2FieldSx}
                      disabled
                      value={formData.npmSdkVersion?.value || ""}
                    />
                  </Grid>
                )}
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 700,
                  color: "text.secondary",
                  mb: 1.25,
                  display: "block",
                }}
              >
                Optional modules
              </Typography>
              <FormControl id="camunda-modules">
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Checkbox
                        size="small"
                        onChange={(e) =>
                          changeModules({
                            name: "process-test",
                            checked: e.target.checked,
                          })
                        }
                        checked={modules["process-test"]}
                      />
                    }
                    label={
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        <Typography variant="body2">
                          {language === "java"
                            ? "Camunda Process Test (CPT)"
                            : "@camunda8/process-test"}
                        </Typography>
                        {language === "nodejs" && (
                          <Chip
                            label="Experimental"
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: "0.65rem",
                              fontWeight: 600,
                              bgcolor: "rgba(252, 93, 13, 0.1)",
                              color: "#FC5D0D",
                              border: "1px solid rgba(252, 93, 13, 0.3)",
                              "& .MuiChip-label": { px: 0.75 },
                            }}
                          />
                        )}
                        <Link
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            ml: 0.5,
                          }}
                          target="_blank"
                          href={language === "java"
                            ? "https://docs.camunda.io/docs/apis-tools/testing/getting-started/"
                            : "https://github.com/jwulf/camunda-process-test-js"}
                        >
                          <Tooltip title="Go to Docs" placement="top">
                            <BookOutlined sx={{ fontSize: "1rem" }} />
                          </Tooltip>
                        </Link>
                      </Box>
                    }
                  />
                </FormGroup>
              </FormControl>

              {language === "nodejs" && modules["process-test"] && (
                <Box sx={{ mt: 2 }}>
                  <TextField
                    id="nodejs-process-test-version"
                    label="@camunda8/process-test Version"
                    size="medium"
                    fullWidth
                    sx={step2FieldSx}
                    disabled
                    value={formData.npmProcessTestVersion?.value || ""}
                  />
                </Box>
              )}

              <Box
                sx={{
                  mt: 2.75,
                  display: "flex",
                  gap: 1.25,
                  flexWrap: "nowrap",
                }}
              >
                <Button
                  size="medium"
                  variant="contained"
                  color="primary"
                  startIcon={<Download />}
                  disabled={error}
                  onClick={generateProject}
                  sx={{ flex: 1 }}
                >
                  Generate Project
                </Button>
                <Button
                  size="medium"
                  variant="contained"
                  color="secondary"
                  startIcon={<FolderOpen />}
                  disabled={error}
                  onClick={() => setOpenExplorer(true)}
                  sx={{ color: "white", flex: 1 }}
                >
                  Explore Project
                </Button>
              </Box>
              </Container>

              <Typography variant="subtitle2" sx={{ ...stepHeadingSx, mt: { xs: 2.25, sm: 2.75 } }}>
                Step 3: Deploy and start your first process
              </Typography>
              <Container disableGutters sx={{ m: "20px 0 0 0" }}>
              <Box sx={{ display: "grid", gap: 1 }}>
                {renderCommandBlock(`$ c8ctl deploy ${processFilePath}`, "step3-deploy")}
                {renderCommandBlock(`$ c8ctl create pi --id=${artifactName}-process`, "step3-create")}
              </Box>
              </Container>
            </>
          )}
        </Paper>
      </Container>

      <AppBar
        position="fixed"
        color="default"
        elevation={0}
        sx={{
          top: "auto",
          bottom: 0,
          borderTop: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box sx={{ textAlign: "center", py: 1.5 }}>
          <Typography variant="caption" color="text.secondary">
            <Link
              href="https://camunda.com/legal/privacy/"
              underline="hover"
            >
              Privacy Statement
            </Link>{" "}
            |{" "}
            <Link href="https://camunda.com/legal/imprint/" underline="hover">
              Imprint
            </Link>{" "}
            | Camunda Services GmbH © 2019 – {new Date().getFullYear()}
          </Typography>
        </Box>
      </AppBar>

      {Object.keys(formData).length > 0 && (
        <Dialog open={openExplorer} onClose={handleClose} fullScreen>
          <AppBar
            sx={{ backgroundColor: (theme) => theme.palette.secondary.main }}
            elevation={0}
            position="fixed"
          >
            <Toolbar>
              <IconButton
                edge="start"
                color="inherit"
                onClick={handleClose}
                aria-label="close"
              >
                <Close />
              </IconButton>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                Project explorer
              </Typography>
            </Toolbar>
          </AppBar>

          <Box sx={{ display: "flex", height: "100vh", mt: "64px" }}>
            <Box
              sx={{
                flexShrink: 0,
                borderRight: "1px solid",
                borderColor: "divider",
                overflowY: "auto",
              }}
            >
              <List disablePadding>
                {getFileList(language, formData, modules).map(
                  ({ key, filename, type, path }, idx) => (
                    <React.Fragment key={key}>
                      {idx > 0 && <Divider />}
                      <ListItemButton
                        selected={selectedFile === key}
                        onClick={() => highlight(key, type)}
                        sx={{ py: 1.5 }}
                      >
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <InsertDriveFileOutlined
                            fontSize="small"
                            color={selectedFile === key ? "secondary" : "action"}
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={filename}
                          secondary={path}
                          primaryTypographyProps={{
                            variant: "body2",
                            fontWeight: selectedFile === key ? 600 : 400,
                          }}
                          secondaryTypographyProps={{ variant: "caption" }}
                        />
                      </ListItemButton>
                    </React.Fragment>
                  )
                )}
              </List>
            </Box>

            <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
              {sourceCode && isBpmnFile(sourceCode.fileKey) && (
                <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
                  <ButtonGroup size="small" variant="outlined">
                    <Button
                      startIcon={<AccountTree />}
                      variant={viewMode === "diagram" ? "contained" : "outlined"}
                      onClick={() => setViewMode("diagram")}
                    >
                      Diagram
                    </Button>
                    <Button
                      startIcon={<Code />}
                      variant={viewMode === "xml" ? "contained" : "outlined"}
                      onClick={() => setViewMode("xml")}
                    >
                      XML
                    </Button>
                  </ButtonGroup>
                </Box>
              )}

              <Box sx={{ flex: 1, overflowY: "auto" }}>
                {loadingFile ? (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "100%",
                    }}
                  >
                    <CircularProgress />
                  </Box>
                ) : sourceCode ? (
                  <>
                    {isBpmnFile(sourceCode.fileKey) && viewMode === "diagram" ? (
                      <Box
                        ref={bpmnContainerRef}
                        sx={{
                          height: "100%",
                          width: "100%",
                          overflow: "hidden",
                          "& .djs-canvas": {
                            backgroundColor: "#f5f5f5",
                          },
                        }}
                      />
                    ) : (
                      <SyntaxHighlighter
                        showLineNumbers
                        language={sourceCode.type}
                        style={a11yLight}
                        customStyle={{
                          margin: 0,
                          minHeight: "100%",
                          fontSize: "0.85rem",
                        }}
                      >
                        {sourceCode.text}
                      </SyntaxHighlighter>
                    )}
                  </>
                ) : (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "100%",
                      color: "text.secondary",
                    }}
                  >
                    <Typography variant="body2">
                      Select a file to preview
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </Dialog>
      )}
    </div>
  );
};

export default App;
