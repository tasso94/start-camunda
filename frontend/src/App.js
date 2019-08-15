import React from 'react';

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

function App() {
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
              id="username"
              label="Username"
              defaultValue="demo"
              fullWidth />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              id="password"
              label="Password"
              type="password"
              defaultValue="demo"
              fullWidth />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Group"
              fullWidth
              defaultValue="com.example.workflow"
              required
              id="group" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              id="artifact"
              label="Artifact"
              fullWidth
              defaultValue="my-project"
              required />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl id="camunda-version"
                         fullWidth
                         defaultValue="7.11.0"
                         required>
              <InputLabel htmlFor="age-simple">Camunda BPM Version</InputLabel>
              <Select>
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
              value="3.3.1"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth
                         defaultValue="h2"
                         required
                         id="database">
              <InputLabel htmlFor="age-simple">Database</InputLabel>
              <Select>
                <MenuItem value="postgresql">PostgreSQL</MenuItem>
                <MenuItem value="mysql">MySQL</MenuItem>
                <MenuItem value="h2">H2</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              id="java-version"
              label="Java Version"
              fullWidth
              required />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl id="modules"
                         component="fieldset">
              <FormLabel component="legend">
                Camunda BPM Modules
              </FormLabel>

              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox value="gilad" />
                  }
                  label="REST API"
                />
                <FormControlLabel
                  control={
                    <Checkbox value="jason" />
                  }
                  label="Webapps"
                />
              </FormGroup>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl id="modules"
                         component="fieldset">
              <FormLabel component="legend">
                Spring Boot Modules
              </FormLabel>

              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox value="gilad" />
                  }
                  label="Security"
                />
                <FormControlLabel
                  control={
                    <Checkbox value="jason" />
                  }
                  label="Web"
                />
              </FormGroup>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Button variant="contained" color="primary" className={classes.button}>
              Generate Project
            </Button>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Button variant="contained" color="secondary" className={classes.button}>
              Explore Project
            </Button>
          </Grid>
        </Grid>
        </Paper>
      </Container>
    </div>
  );
}

export default App;
