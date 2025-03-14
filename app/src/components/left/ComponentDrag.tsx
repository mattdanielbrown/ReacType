/* eslint-disable max-len */
import React from 'react';
import Grid from '@mui/material/Grid';
import { RootState } from '../../redux/store';
import makeStyles from '@mui/styles/makeStyles';
import { useSelector } from 'react-redux';
import ComponentPanelItem from '../right/ComponentPanelItem';
import HeaderButton from '../left/HeaderButton';

const useStyles = makeStyles({
  panelWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flexGrow: 1,
    overflow: 'auto'
  },
  panelWrapperList: {
    minHeight: 'auto'
  },
  lightThemeFontColor: {
    color: '#fff'
  },
  darkThemeFontColor: {
    color: '#f88e16,'
  }
});

/**
 * Displays a panel of components that can be dragged onto a canvas, typically used in designing UI frameworks like Next.js or Gatsby.js.
 * This panel shows only "root" components which are typically top-level pages in these frameworks.
 *
 * @param {{ isVisible: boolean, isThemeLight: boolean }} props The props passed to the component.
 * @param {boolean} props.isVisible Determines if the component panel should be displayed.
 * @param {boolean} props.isThemeLight Indicates if the theme is light, affecting the text color styling.
 * @returns {JSX.Element | null} A styled list of draggable component items if visible, otherwise null.
 */
const ComponentDrag = ({
  handleClickEditModule,
  isVisible,
  isThemeLight
}): JSX.Element | null => {
  const classes = useStyles();
  const state = useSelector((store: RootState) => store.appState);
  let buttonTitle =
    state.projectType === 'Next.js' || state.projectType === 'Gatsby.js'
      ? 'Pages'
      : 'Root';

  const isFocus = (targetId: number) =>
    state.canvasFocus.componentId === targetId ? true : false;

  if (!isVisible) return null;

  return (
    <div className={classes.panelWrapper}>
      <div className={classes.panelWrapperList}>
        <HeaderButton
          headerName={buttonTitle}
          id={buttonTitle}
          infoText={
            'The root serves as the entry point for the rest of the app. Use a root component as the foundation from which all the rest of your hierarchy is nested.'
          }
        />
        {/* <h4 className={classes.darkThemeFontColor} style={{ color: '#f88e16' }}>
          {state.projectType === 'Next.js' || state.projectType === 'Gatsby.js'
            ? 'Pages'
            : 'Root Module(s)'}
        </h4> */}
        <Grid
          container
          direction="column"
          justifyContent="center"
          alignItems="center"
          width="100vw"
          maxWidth="240px"
        >
          {state.components
            .filter((comp) => state.rootComponents.includes(comp.id))
            .map((comp) => {
              return (
                <ComponentPanelItem
                  isFocus={isFocus(comp.id)}
                  key={`comp-${comp.id}`}
                  name={comp.name}
                  id={comp.id}
                  root={true}
                  isThemeLight={isThemeLight}
                  handleClickEditModule={handleClickEditModule}
                />
              );
            })}
        </Grid>
      </div>
    </div>
  );
};

export default ComponentDrag;
