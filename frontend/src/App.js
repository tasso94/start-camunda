import React from 'react';
import './App.css';

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

function App() {
  return (
    <div className="App">
      <Container maxWidth="sm">
        <Container maxWidth="sm">
          <TextField
            id="standard-name"
            label="Username"
            
          />
          <TextField
            id="standard-name"
            label="Password"
            type="password"
            
          />
        </Container>
        <FormControl fullWidth
                     component="bla">
          <InputLabel htmlFor="age-simple">Database</InputLabel>
          <Select
            inputProps={{
              name: 'age',
              id: 'age-simple',
            }}>
            <MenuItem value={10}>PostgreSQL</MenuItem>
            <MenuItem value={30}>MySQL</MenuItem>
            <MenuItem value={20}>H2</MenuItem>
          </Select>
        </FormControl>
        <TextField
          id="standard-name"
          label="Group"
          fullWidth
          
        />
        <TextField
          id="standard-name"
          label="Artifact"
          fullWidth
          
        />
        <TextField
          id="standard-name"
          label="Camunda BPM Version"
          fullWidth
          
        />
        <TextField
          id="standard-name"
          label="Spring Boot Version"
          fullWidth
        />
        <TextField
          id="standard-name"
          label="Java Version"
          fullWidth
        />
        <FormControl component="fieldset">
          <FormLabel component="legend">
            Camunda BPM Modules:
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

        <FormControl component="fieldset">
          <FormLabel component="legend">
            Spring Boot Modules:
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
      </Container>
    </div>
  );
}

export default App;
