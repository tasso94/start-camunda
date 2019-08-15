import React from 'react';
import { useState } from 'react';
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

function App() {

  const [artifact, setArtifact] = useState('my-project'),
        [group, setGroup] = useState('com.example.workflow'),
        [username, setUsername] = useState(),
        [password, setPassword] = useState(),
        [database, setDatabase] = useState(),
        [version, setVersion] = useState(),
        [camundaVersion, setCamundaVersion] = useState(),
        [springBootVersion, setSpringBootVersion] = useState(''),
        [javaVersion, setJavaVersion] = useState(),
        [modules, setModules] = useState({
          'camunda-rest': true,
          'camunda-webapps': false,
          'spring-boot-security': false,
          'spring-boot-web': false
        });

  function generateProject() {
    var moduleNames = Object.keys(modules).filter(name => {
      return modules[name];
    });

    fetch('http://localhost:8080/download', {
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
        "version": version,
        "camundaVersion": camundaVersion,
        "springBootVersion": springBootVersion,
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
    setOpen(false);
  }

  function changeCamundaVersion(version) {
    switch (version) {
      case '7.8.0':
        setSpringBootVersion('1.5.8.RELEASE');
        break;
      case '7.9.0':
        setSpringBootVersion('2.0.0.RELEASE');
        break;
      case '7.10.0':
        setSpringBootVersion('2.1.x.RELEASE');
        break;
      case '7.11.0':
        setSpringBootVersion('2.1.x.RELEASE');
        break;
      case 'SNAPSHOT':
        setSpringBootVersion('2.1.x.RELEASE');
        break;
      default:
        throw new Error("Not existing Camunda Version!");
    }

    setCamundaVersion(version);
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
      }
    }),
  );

  const classes = useStyles();

  return (
    <div className="App">
      <AppBar position="static" color="default">
        <Toolbar>
          <img src="https://camunda.com/svg/logo.svg" width={160} />
        </Toolbar>
      </AppBar>

      <Container className={classes.root}>
        <Paper className={classes.paper}>
        <Typography className={classes.headline} variant="h5">
          Start Camunda BPM
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Group"
              fullWidth
              required
              id="group"
              value={group}
              onInput={e => setGroup(e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6}>
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
              <InputLabel htmlFor="age-simple">Camunda BPM Version</InputLabel>
              <Select value={camundaVersion}
                      onChange={e => changeCamundaVersion(e.target.value)}>
                <MenuItem value="7.8.0">7.8.0</MenuItem>
                <MenuItem value="7.9.0">7.9.0</MenuItem>
                <MenuItem value="7.10.0">7.10.0</MenuItem>
                <MenuItem value="7.11.0">7.11.0 (current)</MenuItem>
                <MenuItem value="SNAPSHOT">SNAPSHOT</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              id="spring-boot-version"
              label="Spring Boot Version"
              fullWidth
              disabled
              value={springBootVersion}
              onInput={e => setSpringBootVersion(e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth
                         required
                         id="database">
              <InputLabel htmlFor="age-simple">Database</InputLabel>
              <Select value={database}
                      onChange={e => setDatabase(e.target.value)}>
                <MenuItem value="postgresql">PostgreSQL</MenuItem>
                <MenuItem value="mysql">MySQL</MenuItem>
                <MenuItem value="h2">H2</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              id="java-version"
              label="Java Version (8 to 12)"
              fullWidth
              required
              value={javaVersion}
              onInput={e => setJavaVersion(e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl id="camunda-modules">
              <FormLabel component="legend">
                Camunda BPM Modules
              </FormLabel>

              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox onChange={e => changeModules({name: 'camunda-rest', checked: e.target.checked})} defaultChecked={modules['camunda-rest']} />
                  }
                  label="REST API" />
                <FormControlLabel
                  control={
                    <Checkbox onChange={e => changeModules({name: 'camunda-webapps', checked: e.target.checked})} />
                  }
                  label="Webapps" />
              </FormGroup>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl id="spring-boot-modules">
              <FormLabel component="legend">
                Spring Boot Modules
              </FormLabel>

              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox onChange={e => changeModules({name: 'spring-boot-security', checked: e.target.checked})} />
                  }
                  label="Security" />
                <FormControlLabel
                  control={
                    <Checkbox onChange={e => changeModules({name: 'spring-boot-web', checked: e.target.checked})} />
                  }
                  label="Web" />
              </FormGroup>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              id="username"
              label="Admin Username"
              fullWidth
              value={username}
              onInput={e => setUsername(e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              id="password"
              label="Admin Password"
              type="password"
              fullWidth
              value={password}
              onInput={e => setPassword(e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Button variant="contained" color="primary" className={classes.button} onClick={generateProject}>
              Generate Project
            </Button>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Button variant="contained" color="secondary" className={classes.button} onClick={handleClickOpen}>
              Explore Project
            </Button>
          </Grid>
        </Grid>
        </Paper>
      </Container>

      <Dialog open={open} onClose={handleClose}>
        <AppBar className={classes.appBar}>
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={handleClose} aria-label="close">
              <CloseIcon />
            </IconButton>
            <Typography variant="h6" className={classes.title}>
              Sound
            </Typography>
            <Button color="inherit" onClick={handleClose}>
              save
            </Button>
          </Toolbar>
        </AppBar>
        <List>
          <ListItem button>
            <ListItemText primary="Phone ringtone" secondary="Titania" />
          </ListItem>
          <Divider />
          <ListItem button>
            <ListItemText primary="Default notification ringtone" secondary="Tethys" />
          </ListItem>
        </List>
      </Dialog>
    </div>
  );
}

export default App;
