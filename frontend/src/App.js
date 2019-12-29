import React from 'react';
import { useState, useEffect } from 'react';
import { Theme, createStyles, makeStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import Container from '@material-ui/core/Container';
import FormControl from '@material-ui/core/FormControl';
import FormLabel from '@material-ui/core/FormLabel';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import List from  '@material-ui/core/List';
import ListItem from  '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Divider from '@material-ui/core/Divider';
import Box from '@material-ui/core/Box';
import Link from '@material-ui/core/Link';
import BookOutlined from '@material-ui/icons/BookOutlined';
import Tooltip from '@material-ui/core/Tooltip';

function App() {

  const [artifact, setArtifact] = useState('my-project'),
        [group, setGroup] = useState('com.example.workflow'),
        [username, setUsername] = useState(),
        [password, setPassword] = useState(),
        [database, setDatabase] = useState('h2'),
        [starterVersion, setStarterVersion] = useState(''),
        [springBootVersion, setSpringBootVersion] = useState(''),
        [camundaVersion, setCamundaVersion] = useState(''),
        [javaVersion, setJavaVersion] = useState('8'),
        [modules, setModules] = useState({
          'camunda-rest': true,
          'camunda-webapps': true,
          'spring-boot-security': false,
          'spring-boot-web': false
        }),
        [starterVersions, setStarterVersions] = useState([]);

  function generateProject() {
    var moduleNames = Object.keys(modules).filter(name => {
      return modules[name];
    });

    fetch('./download', {
      method: 'post',
      headers: {
        "Content-Type": 'application/json'
      },
      body: JSON.stringify({
        "group": group,
        "artifact": artifact,
        "username": username,
        "password": password,
        "database": database,
        "starterVersion": starterVersion,
        "javaVersion": javaVersion,
        "modules": moduleNames
      })
    }).then(response => {
      if (response.status === 200) {

        var filename = artifact.length < 1 ? 'my-project' : artifact;
        response.blob().then(blob => require('downloadjs')(blob, filename + '.zip'));
      } else {

      }
    });
  }

  const [open, setOpen] = React.useState(false);

  function handleClickOpen() {
    setOpen(true);
  }

  function handleClose() {
    setHtml();
    setOpen(false);
  }

  function changeStarterVersion(version, versions) {
    setStarterVersion(version);
    versions.forEach(versions => {
      if (versions.starterVersion === version) {
        setSpringBootVersion(versions.springBootVersion);
        setCamundaVersion(versions.camundaVersion);
      }
    });
  }

  function fetchStarterVersions() {
    fetch('./versions.json').then(response => {
      if (response.status === 200) {
        response.json().then(json => {
          setStarterVersions(json.starterVersions);
          var latestVersion = json.starterVersions[0].starterVersion;
          changeStarterVersion(latestVersion, json.starterVersions);
        });
      }
    });
  }

  function getMajorMinor(version) {
    var versionTokens = version.split('.');
    return versionTokens[0] + '.' + versionTokens[1];
  }

  function changeModules(module) {
    modules[module.name] = module.checked;

    setModules(modules);
  }

  const useStyles = makeStyles((theme: Theme) =>
    createStyles({
      button: {
        marginTop: 25,
      },
      headline: {
        marginBottom: 25
      },
      root: {
        marginTop: 60,
        width: 700
      },
      paper: {
        padding: theme.spacing(6, 4)
      },
      appBar: {
        backgroundColor: theme.palette.secondary.main
      },
      footer: {
        top: 'auto',
        bottom: 0,
        height: 40,
        padding: 10
      },
      list: {
        marginTop:80
      },
      docs: {
        marginLeft:15,
        verticalAlign:'text-top'
      }
    }),
  );

  const [html, setHtml] = useState();

  function highlight(filename, type) {
    var moduleNames = Object.keys(modules).filter(name => {
      return modules[name];
    });

    fetch('./show/' + filename, {
      method: 'post',
      headers: {
        "Content-Type": 'application/json'
      },
      body: JSON.stringify({
        "group": group,
        "artifact": artifact,
        "username": username,
        "password": password,
        "database": database,
        "starterVersion": starterVersion,
        "javaVersion": javaVersion,
        "modules": moduleNames
      })
    }).then(response => {
      if (response.status === 200) {
        response.text().then(text => {
            text = text.replace(/[<>&'"]/g, function (c) {
              switch (c) {
                case '<':
                  return '&lt;';
                case '>':
                  return '&gt;';
                case '&':
                  return '&amp;';
                case '\'':
                  return '&apos;';
                case '"':
                  return '&quot;';
              }
            });
          setHtml({__html: '<pre><code class="language-' + type + '">' + text + '</code></pre>'});
        });
      } else {

      }
    });
  }

  function highlightPom() {
    highlight('pom.xml', 'xml');
  }

  function highlightAppYaml() {
    highlight('application.yaml', 'yaml');
  }

  function highlightAppJava() {
    highlight('Application.java', 'java');
  }

  function highlightProcess() {
    highlight('process.bpmn', 'xml');
  }

  const classes = useStyles();

  useEffect(() => {
    fetchStarterVersions();
    window.addEventListener('beforeunload', function(e) {
      e.preventDefault();
      e.returnValue = true;
    });
  }, []);

  return (
    <div className="App">
      <AppBar position="static"
              color="default">
        <Toolbar>
          <img src="https://camunda.com/svg/logo.svg"
               width={160} />
        </Toolbar>
      </AppBar>

      <Container className={classes.root}>
        <Paper className={classes.paper}>
        <Typography className={classes.headline}
                    variant="h5">
          Start Camunda BPM
        </Typography>
        {starterVersions.length === 0 &&
          <Typography>
            Loading...
          </Typography>
        }
        {starterVersions.length > 0 &&
        <Grid container
              spacing={3}>
          <Grid item
                xs={12}
                sm={6}>
            <TextField
              label="Group"
              fullWidth
              required
              id="group"
              value={group}
              onInput={e => setGroup(e.target.value)} />
          </Grid>
          <Grid item
                xs={12}
                sm={6}>
            <TextField
              id="artifact"
              label="Artifact"
              fullWidth
              required
              value={artifact}
              onInput={e => setArtifact(e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl id="camunda-version"
                         fullWidth
                         required>
              <InputLabel htmlFor="camunda-version">Camunda BPM Version</InputLabel>
              <Select value={starterVersion}
                      onChange={e => changeStarterVersion(e.target.value, starterVersions)}>
                {starterVersions.map(versions => {
                   return <MenuItem value={versions.starterVersion}>{versions.camundaVersion}</MenuItem>;
                })}
              </Select>
            </FormControl>
          </Grid>
          <Grid item
                xs={12}
                sm={6}>
            <TextField
              id="spring-boot-version"
              label="Spring Boot Version"
              fullWidth
              disabled
              value={springBootVersion} />
          </Grid>
          <Grid item
                xs={12}
                sm={6}>
            <FormControl fullWidth
                         required
                         id="database">
              <InputLabel htmlFor="database">Database</InputLabel>
              <Select value={database}
                      onChange={e => setDatabase(e.target.value)}>
                <MenuItem value="postgresql">PostgreSQL</MenuItem>
                <MenuItem value="mysql">MySQL</MenuItem>
                <MenuItem value="h2">H2</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item
                xs={12}
                sm={6}>
            <TextField
              id="java-version"
              label="Java Version"
              fullWidth
              required
              type="number"
              value={javaVersion}
              onInput={e => setJavaVersion(e.target.value)} />
          </Grid>
          <Grid item
                xs={12}
                sm={6}>
            <FormControl id="camunda-modules">
              <FormLabel component="legend">
                Camunda BPM Modules
              </FormLabel>

              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox onChange={e => changeModules({name: 'camunda-rest', checked: e.target.checked})}
                              defaultChecked={modules['camunda-rest']} />
                  }
                  label={
                    <>
                      REST API
                      <Link className={classes.docs}
                            target="_blank"
                            href={'https://docs.camunda.org/manual/' + getMajorMinor(camundaVersion) + '/reference/rest/'}>
                        <Tooltip title="Go to Docs" placement="top">
                          <BookOutlined fontSize="small" />
                        </Tooltip>
                      </Link>
                    </>
                  } />
                <FormControlLabel
                  control={
                    <Checkbox onChange={e => changeModules({name: 'camunda-webapps', checked: e.target.checked})}
                              defaultChecked={modules['camunda-webapps']} />
                  }
                  label={
                    <>
                      Webapps
                      <Link className={classes.docs}
                            target="_blank"
                            href={'https://docs.camunda.org/manual/' + getMajorMinor(camundaVersion) + '/webapps/cockpit/'}>
                        <Tooltip title="Go to Docs" placement="top">
                          <BookOutlined fontSize="small" />
                        </Tooltip>
                      </Link>
                    </>
                  } />
              </FormGroup>
            </FormControl>
          </Grid>
          <Grid item
                xs={12}
                sm={6}>
            <FormControl id="spring-boot-modules">
              <FormLabel component="legend">
                Spring Boot Modules
              </FormLabel>

              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox onChange={e => changeModules({name: 'spring-boot-security', checked: e.target.checked})}
                              defaultChecked={modules['spring-boot-security']} />
                  }
                  label="Security" />
                <FormControlLabel
                  control={
                    <Checkbox onChange={e => changeModules({name: 'spring-boot-web', checked: e.target.checked})}
                              defaultChecked={modules['spring-boot-web']} />
                  }
                  label="Web" />
              </FormGroup>
            </FormControl>
          </Grid>
          <Grid item
                xs={12}
                sm={6}>
            <TextField
              id="username"
              label="Admin Username"
              fullWidth
              value={username}
              onInput={e => setUsername(e.target.value)} />
          </Grid>
          <Grid item
                xs={12}
                sm={6}>
            <TextField
              id="password"
              label="Admin Password"
              type="password"
              fullWidth
              value={password}
              onInput={e => setPassword(e.target.value)} />
          </Grid>
          <Grid item
                xs={12}
                sm={6}>
            <Button variant="contained"
                    color="primary"
                    className={classes.button}
                    onClick={generateProject}>
              Generate Project
            </Button>
          </Grid>
          <Grid item
                xs={12}
                sm={6}>
            <Button variant="contained"
                    color="secondary"
                    className={classes.button}
                    onClick={handleClickOpen}>
              Explore Project
            </Button>
          </Grid>
        </Grid>
        }
        </Paper>
      </Container>

      <AppBar position="fixed"
              color="default"
              className={classes.footer}>
        <Box fullWidth align='center'>
          <Link href="https://camunda.com/legal/privacy/">Privacy Statement</Link> | <Link href="https://camunda.com/legal/imprint/">Imprint</Link> | Camunda Services GmbH © 2019 - {new Date().getFullYear()}
        </Box>
      </AppBar>

      <Dialog open={open}
              onClose={handleClose}
              fullScreen>
        <AppBar className={classes.appBar}>
          <Toolbar>
            <IconButton edge="start"
                        color="inherit"
                        onClick={handleClose}
                        aria-label="close">
              <CloseIcon />
            </IconButton>
            <Typography variant="h6"
                        className={classes.title}>
              Project Explorer
            </Typography>
          </Toolbar>
        </AppBar>

        <Grid container
              spacing={3}>
          <Grid item xs={12} sm={4}>
          <List className={classes.list}>
            <ListItem button>
              <ListItemText onClick={highlightPom}
                            primary="pom.xml"
                            secondary={artifact + '/'} />
            </ListItem>
            <Divider />
            <ListItem button>
              <ListItemText onClick={highlightAppYaml}
                            primary="application.yaml"
                            secondary={artifact + '/src/main/resources/'} />
            </ListItem>
            <Divider />
            <ListItem button>
              <ListItemText onClick={highlightProcess}
                            primary="process.bpmn"
                            secondary={artifact + '/src/main/resources/'} />
            </ListItem>
            <Divider />
            <ListItem button>
              <ListItemText onClick={highlightAppJava}
                            primary="Application.java"
                            secondary={artifact + '/src/main/java/' + group.replace(/\./g,'/') + '/'} />
            </ListItem>
          </List>
          </Grid>
          <Grid item xs={12} sm={8}>
            <Box className={classes.list}
                 dangerouslySetInnerHTML={html} />
          </Grid>
        </Grid>
      </Dialog>
    </div>
  );
}

export default App;
