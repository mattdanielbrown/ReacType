/* eslint-disable max-len */
import React from 'react';
import { useDrag } from 'react-dnd';
import { useDispatch, useSelector } from 'react-redux';
import { ChildElement, HTMLType } from '../../interfaces/Interfaces';
import { ItemTypes } from '../../constants/ItemTypes';
import { combineStyles } from '../../helperFunctions/combineStyles';
import globalDefaultStyle from '../../public/styles/globalDefaultStyles';
import DeleteButton from './DeleteButton';
import { changeFocus } from '../../redux/reducers/slice/appStateSlice';
import { RootState } from '../../redux/store';
import { emitEvent } from '../../helperFunctions/socket';

/**
 * Renders a direct child HTML element within the canvas. This component is draggable and clickable, allowing users to interact with it dynamically.
 * It displays the placeholder or a short representation of the HTML type and includes a delete button for component management.
 *
 * @param {Object} props - Component props.
 * @param {number} props.childId - Unique identifier for the child component.
 * @param {string} props.name - The display name of the HTML element.
 * @param {string} props.type - The type of the component (e.g., HTML element, custom component).
 * @param {number} props.typeId - Identifier for the specific type of HTML element.
 * @param {Object} props.style - Custom styles applied to the HTML element.
 * @returns {JSX.Element} A styled, draggable, and interactive representation of the HTML element on the canvas.
 */
function DirectChildHTML({
  childId,
  name,
  type,
  typeId,
  style,
}: ChildElement): JSX.Element {
  const state = useSelector((store: RootState) => store.appState);

  const roomCode = useSelector((store: RootState) => store.roomSlice.roomCode);

  const dispatch = useDispatch();

  // find the HTML element corresponding with this instance of an HTML element
  // find the current component to render on the canvas
  const HTMLType: HTMLType = state.HTMLTypes.find(
    (type: HTMLType) => type.id === typeId,
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
    },
    collect: (monitor: any) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

  const changeFocusFunction = (componentId: number, childId: number | null) => {
    dispatch(changeFocus({ componentId, childId }));
    if (roomCode) {
      emitEvent('changeFocusAction', roomCode, {
        componentId: componentId,
        childId: childId,
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
  const interactiveStyle = {
    border:
      state.canvasFocus.childId === childId
        ? '2px solid #0671e3'
        : '1px solid #31343A',
  };

  const combinedStyle = combineStyles(
    combineStyles(combineStyles(globalDefaultStyle, HTMLType.style), style),
    interactiveStyle,
  );

  return (
    <div
      onClick={onClickHandler}
      style={{ ...combinedStyle, backgroundColor: '#1E2024' }}
      ref={drag}
      id={`canv${childId}`}
    >
      <span>
        <strong style={{ color: 'white' }}>{HTMLType.placeHolderShort}</strong>
        <DeleteButton
          id={childId}
          name={name[0].toLowerCase() + name.slice(1)}
          onClickHandler={onClickHandler}
        />
      </span>
    </div>
  );
}

export default DirectChildHTML;
