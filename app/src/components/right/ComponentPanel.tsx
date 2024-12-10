/* eslint-disable max-len */
import { Button, Checkbox, FormControlLabel, InputLabel } from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import TextField from '@mui/material/TextField';
import makeStyles from '@mui/styles/makeStyles';
import MuiAlert, { AlertProps } from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import { addComponent } from '../../redux/reducers/slice/appStateSlice';
import { RootState } from '../../redux/store';
import { emitEvent } from '../../helperFunctions/socket';

/**
 * `ComponentPanel` is a React component that facilitates the creation and management of component entities
 * within a user interface design tool. It allows users to add new components with specific characteristics,
 * such as determining if the component is a root component, which affects its behavior and placement within the project.
 *
 * @param {Object} props - Properties passed to the component.
 * @param {boolean} props.isThemeLight - Indicates if the light theme is currently active, influencing the visual styling of the panel.
 *
 * @returns {JSX.Element} A panel that allows users to input details for a new component, such as name and root status, and adds it to the project.
 */
const ComponentPanel = ({ setIsCreatingModule, isThemeLight }): JSX.Element => {
  const classes = useStyles();
  // const { state, contextParam } = useSelector((store: RootState) => ({
  //   state: store.appState,
  //   contextParam: store.contextSlice
  // }));

  const state = useSelector((store: RootState) => store.appState);
  const contextParam = useSelector((store: RootState) => store.contextSlice);
  const roomCode = useSelector((store: RootState) => store.roomSlice.roomCode);

  const dispatch = useDispatch();

  // state hooks for inputted component name, component id and array of components
  const [errorStatus, setErrorStatus] = useState(false);
  // errorMsg refers to the error message on the new component text field
  const [errorMsg, setErrorMsg] = useState('');
  const [compName, setCompName] = useState('');
  const [isRoot, setIsRoot] = useState(false);
  const [alertOpen, setAlertOpen] = React.useState<boolean>(false);

  // function to create error message for component name input
  const triggerError = (type: string) => {
    setErrorStatus(true);
    if (type === 'empty') {
      setErrorMsg('Component name cannot be blank.');
    } else if (type === 'dupe') {
      setErrorMsg('Component name already exists.');
    } else if (type === 'letters') {
      setErrorMsg('Component name must start with a letter.');
    } else if (type === 'symbolsDetected') {
      setErrorMsg('Component name must not contain symbols.');
    } else if (type === 'rootDupe') {
      setErrorMsg('Component name cannot be root component name.');
    }
  };

  const handleNameInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorStatus(false);
    setCompName(e.target.value);
  };

  // "Root" components are not draggable into the main canvas
  // If next.js or Gatsby.js mode is on, root components will be separate pages
  const toggleRootStatus = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsRoot(isRoot ? false : true);
  };

  // Add a new component
  const createOption = (inputName: string) => {
    // format name so first letter is capitalized and there are no white spaces
    let inputNameClean = inputName.replace(/\s+/g, ''); // removes spaces
    const formattedName =
      state.projectType === 'Classic React'
        ? inputNameClean.charAt(0).toUpperCase() + inputNameClean.slice(1) // capitalizes first letter
        : inputNameClean;
    // add new component to state
    dispatch(
      addComponent({
        componentName: formattedName,
        root: isRoot,
        contextParam: contextParam
      })
    );

    if (roomCode) {
      emitEvent('addComponentAction', roomCode, {
        componentName: formattedName,
        root: isRoot,
        contextParam: contextParam
      });
    }

    // reset root toggle back to default position
    setIsRoot(false);
    // reset name field
    setCompName('');
  };

  const handleNameSubmit = () => {
    // creates a component if no error conditions triggered
    let letters = /[a-zA-Z]/;
    let error;
    if (compName.trim() === '') {
      error = 'empty';
    } else if (!compName.charAt(0).match(letters)) {
      error = 'letters';
    } else if (!compName.match(/^[0-9a-zA-Z]+$/)) {
      error = 'symbolsDetected';
    } else if (
      state.components.some(
        (comp) => comp.name.toLowerCase() === compName.toLowerCase()
      )
    ) {
      error = 'dupe';
    } else if (
      compName.toLowerCase() === 'index' ||
      compName.toLowerCase() === 'app'
    ) {
      error = 'rootDupe';
    } else {
      createOption(compName);
      setErrorStatus(false);
      setAlertOpen((true));
      setIsCreatingModule(false);
      return;
    }
    triggerError(error);
  };

  const keyBindCreateComponent = useCallback((e) => {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      document.getElementById('addComponentButton').click();
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', keyBindCreateComponent);
    return () => {
      document.removeEventListener('keydown', keyBindCreateComponent);
    };
  }, []);

  const handleAlertClose = (
    event: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === 'clickaway') {
      return;
    }
    setAlertOpen(false);
  };

  const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
    props,
    ref
  ) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
  });

  return (
    <>
      <div className={`${classes.panelWrapper}`}>
        {/* Add a new component */}
        <div
          className={classes.addComponentWrapper}
          style={{
            border: '2px solid #101012',
            backgroundColor: '#f88e16'
          }}
        >
          <h4
            className={
              isThemeLight
                ? `${classes.newComponent} ${classes.lightThemeFontColor}`
                : `${classes.newComponent} ${classes.darkThemeFontColor}`
            }
          >
            Create new module
          </h4>
          {/* input for new component */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginTop: '20px',
                marginBottom: '20px',
                alignItems: 'baseline'
              }}
            >
              <div style={{ alignSelf: 'center', margin: '10px' }}>
                <InputLabel
                  htmlFor="newcomponentid"
                  className={
                    isThemeLight
                      ? `${classes.inputLabel} ${classes.lightThemeFontColor}`
                      : `${classes.inputLabel} ${classes.darkThemeFontColor}`
                  }
                >
                  Name
                </InputLabel>
                <div className={classes.inputWrapper}>
                  <TextField
                    // label='New Component Name'
                    id="newcomponentid"
                    color="primary"
                    variant="outlined"
                    className={
                      isThemeLight
                        ? `${classes.inputField} ${classes.lightThemeFontColor}`
                        : `${classes.inputField} ${classes.darkThemeFontColor}`
                    }
                    // inputprops and helpertext must be lowercase
                    // inputProps={{ className: classes.input }}
                    value={compName}
                    // Doesn't accept boolean value needs to be a string
                    error={errorStatus}
                    // Updated
                    helperText={errorStatus ? errorMsg : ''}
                    onChange={handleNameInput}
                    style={{}}
                    InputProps={{
                      style: {
                        color: isThemeLight ? 'white' : 'white'
                      }
                    }}
                    placeholder="name"
                  />
                </div>
              </div>

              <div
                className={classes.btnGroup}
                id="checkboxContainer"
                style={{ marginBottom: '30px' }}
              >
                <FormControlLabel
                  value="top"
                  control={
                    <Checkbox
                      className={
                        isThemeLight
                          ? `${classes.rootCheckBox} ${classes.lightThemeFontColor}`
                          : `${classes.rootCheckBox} ${classes.darkThemeFontColor}`
                      }
                      color="primary"
                      checked={isRoot}
                      onChange={() => setIsRoot(!isRoot)}
                    />
                  }
                  label={
                    state.projectType === 'Next.js' ||
                    state.projectType === 'Gatsby.js'
                      ? 'Page'
                      : 'Root'
                  } // name varies depending on mode
                  className={
                    isThemeLight
                      ? `${classes.rootCheckBoxLabel} ${classes.lightThemeFontColor}`
                      : `${classes.rootCheckBoxLabel} ${classes.darkThemeFontColor}`
                  }
                  labelPlacement="top"
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'end' }}>
              <br />
              <Button
                className={
                  isThemeLight
                    ? `${classes.addComponentButton} ${classes.lightThemeFontColor}`
                    : `${classes.addComponentButton} ${classes.darkThemeFontColor}`
                }
                variant="contained"
                sx={{
                  textTransform: 'capitalize',
                  margin: '20px',
                  backgroundColor: '#f88e16 !important',
                  color: 'white !important',
                  border: '2px solid white !important'
                }}
                id="addComponentButton"
                onClick={handleNameSubmit}
              >
                Create
              </Button>
            </div>
          </div>
        </div>
      </div>
      <>
        <Snackbar
          open={alertOpen}
          autoHideDuration={3000}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          onClose={handleAlertClose}
        >
          <Alert
            onClose={handleAlertClose}
            severity="success"
            sx={{ width: '100%', color: 'white' }}
          >
            Module Created!
          </Alert>
        </Snackbar>
      </>
    </>
  );
};

const useStyles = makeStyles({
  inputField: {
    width: '100%',
    marginTop: '10px',
    whiteSpace: 'nowrap',
    overflowX: 'hidden',
    textOverflow: 'ellipsis',
    margin: '0px 0px 0px 10px',
    border: '0px solid grey'
  },
  inputWrapper: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '15px'
  },
  panelWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flexGrow: 1,
    color: '#000000'
  },
  addComponentWrapper: {
    padding: 'auto',
    margin: '0 auto',
    display: 'inline-block'
  },
  rootCheckBox: {
    borderColor: '#0671E3',
    padding: '7px 0'
  },
  rootCheckBoxLabel: {
    borderColor: '#0671e3'
  },
  newComponent: {
    color: '#C6C6C6',
    marginBottom: '25px'
  },
  inputLabel: {
    fontSize: '1em',
    marginLeft: '10px'
  },
  btnGroup: {
    display: 'flex',
    flexDirection: 'column'
  },
  addComponentButton: {
    backgroundColor: 'transparent',
    height: '100px',
    width: '100px',
    fontFamily: 'Roboto, Raleway, sans-serif',
    fontSize: '90%',
    textAlign: 'center',
    borderStyle: 'none',
    transition: '0.3s',
    borderRadius: '25px',
    marginRight: '65px'
  },
  rootToggle: {
    color: '#696969',
    fontSize: '0.85rem'
  },
  lightThemeFontColor: {
    color: 'white',
    '& .MuiInputBase-root': {
      color: 'rgba (0, 0, 0, 0.54)'
    }
  },
  darkThemeFontColor: {
    color: '#fff',
    '& .MuiInputBase-root': {
      color: '#fff'
    }
  }
});

export default ComponentPanel;
