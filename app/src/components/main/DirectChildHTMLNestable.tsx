/* eslint-disable max-len */
import React, { useRef } from 'react';
import { useDrag, useDrop, DropTargetMonitor } from 'react-dnd';
import { useDispatch, useSelector } from 'react-redux';
import { ChildElement, HTMLType } from '../../interfaces/Interfaces';
import { ItemTypes } from '../../constants/ItemTypes';
import { combineStyles } from '../../helperFunctions/combineStyles';
import globalDefaultStyle from '../../public/styles/globalDefaultStyles';
import renderChildren from '../../helperFunctions/renderChildren';
import DeleteButton from './DeleteButton';
import validateNewParent from '../../helperFunctions/changePositionValidation';
import componentNest from '../../helperFunctions/componentNestValidation';
import AddRoute from './AddRoute';
import AddLink from './AddLink';
import { RootState } from '../../redux/store';
import { emitEvent } from '../../helperFunctions/socket';

import {
  changeFocus,
  changePosition,
  addChild,
  snapShotAction
} from '../../redux/reducers/slice/appStateSlice';

/**
 * Represents a draggable and nestable HTML element on a visual design canvas, capable of accepting other draggable items.
 * This component uses React DnD to allow it to be dragged and to accept other draggable components.
 * It can function as a container that other components can be dragged into. When components are dragged onto it,
 * it checks if the nesting is valid and then potentially changes the parent of the dragged component.
 * Additionally, it supports custom route additions and direct child links.
 *
 * @param {ChildElement} props - The properties passed to the component, including:
 * @param {number} props.childId - Unique identifier for the component instance.
 * @param {string} props.type - The type of the component (e.g., 'HTML Element').
 * @param {number} props.typeId - The type identifier, linking to the specific HTML type information.
 * @param {React.CSSProperties} props.style - Custom styles applied to override or complement the default and type-specific styles.
 * @param {React.ReactNode[]} props.children - Child components of this element.
 * @param {string} props.name - The name of the component, used for display and reference.
 * @param {Object} props.attributes - Additional attributes that might influence the rendering or behavior of the component.
 * @returns {JSX.Element} A styled component that can interact within a drag-and-drop interface, reflecting changes in a collaborative environment via socket events.
 */
function DirectChildHTMLNestable({
  childId,
  type,
  typeId,
  style,
  children,
  name,
  attributes
}: ChildElement): React.JSX.Element {
  const state = useSelector((store: RootState) => store.appState);
  const contextParam = useSelector((store: RootState) => store.contextSlice);

  const dispatch = useDispatch();
  const roomCode = useSelector((store: RootState) => store.roomSlice.roomCode);

  const ref = useRef(null);

  // takes a snapshot of state to be used in UNDO and REDO cases.  snapShotFunc is also invoked in Canvas.tsx
  const snapShotFunc = () => {
    // makes a deep clone of state
    const deepCopiedState = JSON.parse(JSON.stringify(state));
    const focusIndex = state.canvasFocus.componentId - 1;
    // pushes the last user action on the canvas into the past array of Component
    dispatch(
      snapShotAction({
        focusIndex: focusIndex,
        deepCopiedState: deepCopiedState
      })
    );
  };

  // find the HTML element corresponding with this instance of an HTML element
  // find the current component to render on the canvas
  const HTMLType: HTMLType = state.HTMLTypes.find(
    (type: HTMLType) => type.id === typeId
  );

  // hook that allows component to be draggable
  const [{ isDragging }, drag] = useDrag({
    // setting item attributes to be referenced when updating state with new instance of dragged item
    item: {
      type: ItemTypes.INSTANCE,
      newInstance: false,
      childId: childId,
      instanceType: type,
      instanceTypeId: typeId,
      name: name
    },
    canDrag: HTMLType.id !== 1000, // dragging not permitted if element is separator
    collect: (monitor: any) => {
      return {
        isDragging: !!monitor.isDragging()
      };
    }
  });

  // both useDrop and useDrag used here to allow canvas components to be both a drop target and drag source
  const [{ isOver }, drop] = useDrop({
    accept: ItemTypes.INSTANCE,
    // triggered on drop
    drop: (item: any, monitor: DropTargetMonitor) => {
      const didDrop = monitor.didDrop();
      // takes a snapshot of state to be used in UNDO and REDO cases
      snapShotFunc();
      if (didDrop) {
        return;
      }
      // updates state with new instance
      // if item dropped is going to be a new instance (i.e. it came from the left panel), then create a new child component
      if (item.newInstance) {
        if (
          (item.instanceType === 'Component' &&
            componentNest(
              state.components[item.instanceTypeId - 1].children,
              childId
            )) ||
          item.instanceType !== 'Component'
        ) {
          dispatch(
            addChild({
              type: item.instanceType,
              typeId: item.instanceTypeId,
              childId: childId,
              contextParam: contextParam
            })
          );
          if (roomCode) {
            emitEvent('addChildAction', roomCode, {
              type: item.instanceType,
              typeId: item.instanceTypeId,
              childId: childId,
              contextParam: contextParam
            });
          }
        }
      }
      // if item is not a new instance, change position of element dragged inside div so that the div is the new parent
      else {
        // check to see if the selected child is trying to nest within itself
        if (validateNewParent(state, item.childId, childId) === true) {
          dispatch(
            changePosition({
              currentChildId: item.childId,
              newParentChildId: childId,
              contextParam: contextParam
            })
          );
          if (roomCode) {
            emitEvent('changePositionAction', roomCode, {
              currentChildId: item.childId,
              newParentChildId: childId,
              contextParam: contextParam
            });
          }
        }
      }
    },

    collect: (monitor: any) => {
      return {
        isOver: !!monitor.isOver({ shallow: true })
      };
    }
  });

  const changeFocusFunction = (componentId: number, childId: number | null) => {
    dispatch(changeFocus({ componentId, childId }));
    if (roomCode) {
      emitEvent('changeFocusAction', roomCode, {
        componentId: componentId,
        childId: childId
      });
    }
  };

  // onClickHandler is responsible for changing the focused component and child component
  function onClickHandler(event) {
    event.stopPropagation();
    changeFocusFunction(state.canvasFocus.componentId, childId);
  }

  // combine all styles so that higher priority style specifications overrule lower priority style specifications
  // priority order is 1) style directly set for this child (style), 2) style of the referenced HTML element, and 3) default styling
  const defaultNestableStyle = { ...globalDefaultStyle };
  const interactiveStyle = {
    border:
      state.canvasFocus.childId === childId
        ? '2px solid #f88e16'
        : '1px solid #31343A'
  };

  // interactive style to change color when nested element is hovered over
  if (isOver) defaultNestableStyle['#3c59ba'];
  defaultNestableStyle.backgroundColor = isOver
    ? '#3c59ba'
    : defaultNestableStyle.backgroundColor;

  const combinedStyle = combineStyles(
    combineStyles(combineStyles(defaultNestableStyle, HTMLType.style), style),
    interactiveStyle
  );

  drag(drop(ref));

  const routeButton = [];
  if (typeId === 17) {
    routeButton.push(<AddRoute id={childId} name={name} />);
  }
  if (typeId === 19) {
    routeButton.push(
      <AddLink
        id={childId}
        onClickHandler={onClickHandler}
        linkDisplayed={
          attributes && attributes.complink ? `${attributes.complink}` : null
        }
      />
    );
  }

  return (
    <div
      onClick={onClickHandler}
      style={{
        ...combinedStyle,
        backgroundColor: isOver ? '#3c59ba' : '#1E2024'
      }}
      ref={ref}
      id={`canv${childId}`}
    >
      <span>
        <strong style={{ color: 'white' }}>{HTMLType.placeHolderShort}</strong>
        <strong style={{ color: '#f88e16' }}>
          {attributes && attributes.compLink ? ` ${attributes.compLink}` : ''}
        </strong>
        {routeButton}
        <DeleteButton
          id={childId}
          name={name}
          onClickHandler={onClickHandler}
        />
      </span>
      {renderChildren(children)}
    </div>
  );
}

export default DirectChildHTMLNestable;
