import React, { useState, useEffect } from "react";

import {
  Tooltip,
  Link,
  Box,
  Divider,
  ListItemText,
  ListItem,
  List,
  IconButton,
  Dialog,
  Button,
  Typography,
  Toolbar,
  AppBar,
  Paper,
  Grid,
  MenuItem,
  Select,
  InputLabel,
  Checkbox,
  FormControlLabel,
  FormGroup,
  FormLabel,
  FormControl,
  Container,
  TextField,
} from "@material-ui/core";

import { createStyles, makeStyles } from "@material-ui/core/styles";
import { Close, BookOutlined } from "@material-ui/icons";

import SyntaxHighlighter from "react-syntax-highlighter";
import a11yLight from "react-syntax-highlighter/dist/esm/styles/hljs/a11y-light";

import downloadjs from "downloadjs";

const initialFormData = {
  artifact: { value: "my-project" },
  group: { value: "com.example.workflow" },
  username: { value: "" },
  password: { value: "" },
  persistence: { value: "on-disk" },
  javaVersion: { value: "15" },
};

const initialModules = {
  "camunda-rest": true,
  "camunda-webapps": true,
  "camunda-spin": true,
  "camunda-assert": false,
  "spring-boot-security": false,
  "spring-boot-web": false,
};

const mapVersions = (version, releases) => {
  for (const release of releases) {
    if (release.starterVersion === version) {
      return {
        starterVersion: { value: version },
        springBootVersion: { value: release.springBootVersion },
        camundaVersion: { value: release.camundaVersion },
      };
    }
  }
};

const getModuleNames = (modules) => {
  const filteredModules = Object.keys(modules).filter((name) => {
    return modules[name];
  });

  if (
    !filteredModules.includes("camunda-webapps") &&
    !filteredModules.includes("camunda-rest")
  ) {
    return [...filteredModules, "camunda-base"];
  } else {
    return filteredModules;
  }
};

const getPayload = (formData) =>
  Object.entries(formData).reduce((acc, [key, value]) => {
    if (key !== "springBootVersion" && key !== "starterVersions") {
      acc[key] = value.value;
    }
    return acc;
  }, {});

const useStyles = makeStyles((theme) =>
  createStyles({
    header: {
      position: "static",
      backgroundImage: "url(./background.png)",
      backgroundPosition: "50%",
    },
    button: {
      marginTop: 25,
    },
    headline: {
      marginBottom: 25,
    },
    root: {
      marginTop: 60,
      width: 700,
    },
    paper: {
      padding: theme.spacing(6, 4),
    },
    appBar: {
      backgroundColor: theme.palette.secondary.main,
    },
    footer: {
      top: "auto",
      bottom: 0,
      height: 40,
      padding: 10,
    },
    list: {
      marginTop: 80,
    },
    docs: {
      marginLeft: 15,
      verticalAlign: "text-top",
    },
  })
);

const App = () => {
  const [formData, setFormData] = useState({});
  const [modules, setModules] = useState(initialModules);
  const [error, setError] = useState(false);
  const [openExplorer, setOpenExplorer] = useState(false);
  const [sourceCode, setSourceCode] = useState();

  useEffect(() => {
    fetch("./versions.json").then((response) => {
      if (response.status === 200) {
        response.json().then(({ starterVersions }) => {
          setFormData({
            ...mapVersions(starterVersions[0].starterVersion, starterVersions),
            starterVersions: { value: starterVersions },
            ...initialFormData,
          });
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

  useEffect(() => {
    setError(
      Object.values(formData).reduce(
        (acc, element) => acc || element.error,
        false
      )
    );
  }, [formData]);

  const handleClose = () => {
    setSourceCode();
    setOpenExplorer(false);
  };

  const getMajorMinor = (version) => {
    const versionTokens = version.split(".");
    return versionTokens[0] + "." + versionTokens[1];
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
        modules: getModuleNames(modules),
      }),
    }).then((response) => {
      if (response.status === 200) {
        response
          .blob()
          .then((blob) => downloadjs(blob, `${formData.artifact.value}.zip`));
      }
    });
  };

  const highlight = (filename, type) => {
    const payload = getPayload(formData);
    fetch(`./show/${filename}`, {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...payload,
        modules: getModuleNames(modules),
      }),
    }).then((response) => {
      if (response.status === 200) {
        response.text().then((text) => {
          setSourceCode({ text, type });
        });
      }
    });
  };

  const handleChangeGroup = (newGroup) => {
    const regex = /^[a-z_]+(\.[a-z_][a-z0-9_]*)*$/i;
    const { group, ...rest } = formData;
    setFormData({
      group: { value: newGroup, error: !regex.test(newGroup) },
      ...rest,
    });
  };

  const classes = useStyles();

  return (
    <div className="App">
      <AppBar position="static" color="default">
        <Toolbar className={classes.header}>
          <img src="./logo.svg" width={110} alt="Camunda" />
        </Toolbar>
      </AppBar>
      <Container className={classes.root}>
        <Paper className={classes.paper}>
          <Typography className={classes.headline} variant="h5">
            Camunda Platform Initializr
          </Typography>
          {Object.keys(formData).length === 0 && (
            <Typography>Loading...</Typography>
          )}
          {Object.keys(formData).length > 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  error={formData.group.error}
                  label="Group"
                  fullWidth
                  id="group"
                  value={formData.group.value}
                  onInput={(e) => handleChangeGroup(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  error={formData.artifact.error}
                  id="artifact"
                  label="Artifact"
                  fullWidth
                  value={formData.artifact.value}
                  onInput={(e) => {
                    const newArtifact = e.target.value;
                    const { artifact, ...rest } = formData;
                    setFormData({
                      artifact: {
                        value: newArtifact,
                        error: !newArtifact,
                      },
                      ...rest,
                    });
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl id="camunda-version" fullWidth>
                  <InputLabel htmlFor="camunda-version">
                    Camunda Platform Version
                  </InputLabel>
                  <Select
                    value={formData.starterVersion.value}
                    onChange={(e) => {
                      const {
                        starterVersion,
                        springBootVersion,
                        camundaVersion,
                        ...rest
                      } = formData;
                      setFormData({
                        ...mapVersions(
                          e.target.value,
                          formData.starterVersions.value
                        ),
                        ...rest,
                      });
                    }}
                  >
                    {formData.starterVersions.value.map((versions, idx) => {
                      return (
                        <MenuItem key={idx} value={versions.starterVersion}>
                          {versions.camundaVersion}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  id="spring-boot-version"
                  label="Spring Boot Version"
                  fullWidth
                  disabled
                  value={formData.springBootVersion.value}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth id="persistence">
                  <InputLabel htmlFor="persistence">H2 Database</InputLabel>
                  <Select
                    value={formData.persistence.value}
                    onChange={(e) => {
                      const { persistence, ...rest } = formData;
                      setFormData({
                        persistence: { value: e.target.value },
                        ...rest,
                      });
                    }}
                  >
                    <MenuItem value="on-disk">On-Disk</MenuItem>
                    <MenuItem value="in-memory">In-Memory</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  error={formData.javaVersion.error}
                  id="java-version"
                  label="Java Version"
                  fullWidth
                  type="number"
                  value={formData.javaVersion.value}
                  onInput={(e) => {
                    const newJavaVersion = e.target.value;
                    const { javaVersion, ...rest } = formData;
                    setFormData({
                      javaVersion: {
                        value: newJavaVersion,
                        error: !(newJavaVersion >= 8 && newJavaVersion <= 15),
                      },
                      ...rest,
                    });
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl id="camunda-modules">
                  <FormLabel component="legend">Camunda Platform Modules</FormLabel>

                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Checkbox
                          onChange={(e) =>
                            changeModules({
                              name: "camunda-rest",
                              checked: e.target.checked,
                            })
                          }
                          defaultChecked={modules["camunda-rest"]}
                        />
                      }
                      label={
                        <>
                          REST API
                          <Link
                            className={classes.docs}
                            target="_blank"
                            href={
                              "https://docs.camunda.org/manual/" +
                              getMajorMinor(formData.camundaVersion.value) +
                              "/reference/rest/"
                            }
                          >
                            <Tooltip title="Go to Docs" placement="top">
                              <BookOutlined fontSize="small" />
                            </Tooltip>
                          </Link>
                        </>
                      }
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          onChange={(e) =>
                            changeModules({
                              name: "camunda-webapps",
                              checked: e.target.checked,
                            })
                          }
                          defaultChecked={modules["camunda-webapps"]}
                        />
                      }
                      label={
                        <>
                          Webapps
                          <Link
                            className={classes.docs}
                            target="_blank"
                            href={
                              "https://docs.camunda.org/manual/" +
                              getMajorMinor(formData.camundaVersion.value) +
                              "/webapps/cockpit/"
                            }
                          >
                            <Tooltip title="Go to Docs" placement="top">
                              <BookOutlined fontSize="small" />
                            </Tooltip>
                          </Link>
                        </>
                      }
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          onChange={(e) =>
                            changeModules({
                              name: "camunda-spin",
                              checked: e.target.checked,
                            })
                          }
                          defaultChecked={modules["camunda-spin"]}
                        />
                      }
                      label={
                        <>
                          Spin (XML & JSON)
                          <Link
                            className={classes.docs}
                            target="_blank"
                            href={`https://docs.camunda.org/manual/${getMajorMinor(
                              formData.camundaVersion.value
                            )}/reference/spin/`}
                          >
                            <Tooltip title="Go to Docs" placement="top">
                              <BookOutlined fontSize="small" />
                            </Tooltip>
                          </Link>
                        </>
                      }
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          onChange={(e) =>
                            changeModules({
                              name: "camunda-assert",
                              checked: e.target.checked,
                            })
                          }
                          defaultChecked={modules["camunda-assert"]}
                        />
                      }
                      label={
                        <>
                          Assert
                          <Link
                            className={classes.docs}
                            target="_blank"
                            href={`https://docs.camunda.org/manual/${getMajorMinor(
                              formData.camundaVersion.value
                            )}/user-guide/testing/#camunda-assertions`}
                          >
                            <Tooltip title="Go to Docs" placement="top">
                              <BookOutlined fontSize="small" />
                            </Tooltip>
                          </Link>
                        </>
                      }
                    />
                  </FormGroup>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl id="spring-boot-modules">
                  <FormLabel component="legend">Spring Boot Modules</FormLabel>

                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Checkbox
                          onChange={(e) =>
                            changeModules({
                              name: "spring-boot-security",
                              checked: e.target.checked,
                            })
                          }
                          defaultChecked={modules["spring-boot-security"]}
                        />
                      }
                      label="Security"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          onChange={(e) =>
                            changeModules({
                              name: "spring-boot-web",
                              checked: e.target.checked,
                            })
                          }
                          defaultChecked={modules["spring-boot-web"]}
                        />
                      }
                      label="Web"
                    />
                  </FormGroup>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  id="username"
                  label="Admin Username"
                  fullWidth
                  value={formData.username.value}
                  onInput={(e) => {
                    const { username, ...rest } = formData;
                    setFormData({
                      username: { value: e.target.value },
                      ...rest,
                    });
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  id="password"
                  label="Admin Password"
                  type="password"
                  fullWidth
                  value={formData.password.value}
                  onInput={(e) => {
                    const { password, ...rest } = formData;
                    setFormData({
                      password: { value: e.target.value },
                      ...rest,
                    });
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button
                  variant="contained"
                  color="primary"
                  className={classes.button}
                  disabled={error}
                  onClick={generateProject}
                >
                  Generate Project
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button
                  variant="contained"
                  color="secondary"
                  className={classes.button}
                  disabled={error}
                  onClick={() => setOpenExplorer(true)}
                >
                  Explore Project
                </Button>
              </Grid>
            </Grid>
          )}
        </Paper>
      </Container>
      <AppBar position="fixed" color="default" className={classes.footer}>
        <Box align="center">
          <Link href="https://camunda.com/legal/privacy/">
            Privacy Statement
          </Link>{" "}
          | <Link href="https://camunda.com/legal/imprint/">Imprint</Link> |
          Camunda Services GmbH © 2019 - {new Date().getFullYear()}
        </Box>
      </AppBar>
      {Object.keys(formData).length > 0 && (
        <Dialog open={openExplorer} onClose={handleClose} fullScreen>
          <AppBar className={classes.appBar}>
            <Toolbar>
              <IconButton
                edge="start"
                color="inherit"
                onClick={handleClose}
                aria-label="close"
              >
                <Close />
              </IconButton>
              <Typography variant="h6" className={classes.title}>
                Project Explorer
              </Typography>
            </Toolbar>
          </AppBar>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <List className={classes.list}>
                <ListItem button>
                  <ListItemText
                    onClick={() => highlight("pom.xml", "xml")}
                    primary="pom.xml"
                    secondary={formData.artifact.value + "/"}
                  />
                </ListItem>
                <Divider />
                <ListItem button>
                  <ListItemText
                    onClick={() => highlight("application.yaml", "yaml")}
                    primary="application.yaml"
                    secondary={formData.artifact.value + "/src/main/resources/"}
                  />
                </ListItem>
                <Divider />
                <ListItem button>
                  <ListItemText
                    onClick={() => highlight("process.bpmn", "xml")}
                    primary="process.bpmn"
                    secondary={formData.artifact.value + "/src/main/resources/"}
                  />
                </ListItem>
                <Divider />
                <ListItem button>
                  <ListItemText
                    onClick={() => highlight("Application.java", "java")}
                    primary="Application.java"
                    secondary={
                      formData.artifact.value +
                      "/src/main/java/" +
                      formData.group.value.replace(/\./g, "/") +
                      "/"
                    }
                  />
                </ListItem>
                {modules["camunda-assert"] && (
                  <>
                    <Divider />
                    <ListItem button>
                      <ListItemText
                        onClick={() => highlight("WorkflowTest.java", "java")}
                        primary="WorkflowTest.java"
                        secondary={
                          formData.artifact.value +
                          "/src/test/java/" +
                          formData.group.value.replace(/\./g, "/") +
                          "/"
                        }
                      />
                    </ListItem>
                    <Divider />
                    <ListItem button>
                      <ListItemText
                        onClick={() => highlight("application.yaml", "yaml")}
                        primary="application.yaml"
                        secondary={formData.artifact.value + "/src/test/resources/"}
                      />
                    </ListItem>
                    <Divider />
                    <ListItem button>
                      <ListItemText
                        onClick={() => highlight("logback-test.xml", "xml")}
                        primary="logback-test.xml"
                        secondary={
                          formData.artifact.value + "/src/test/resources/"
                        }
                      />
                    </ListItem>
                  </>
                )}
              </List>
            </Grid>
            <Grid item xs={12} sm={8}>
              <Box className={classes.list}>
                {sourceCode && (
                  <pre>
                    <code style={{ fontSize: "1rem" }}>
                      <SyntaxHighlighter
                        showLineNumbers
                        language={sourceCode.type}
                        style={a11yLight}
                        fontSize="1rem"
                      >
                        {sourceCode.text}
                      </SyntaxHighlighter>
                    </code>
                  </pre>
                )}
              </Box>
            </Grid>
          </Grid>
        </Dialog>
      )}
    </div>
  );
};

export default App;
