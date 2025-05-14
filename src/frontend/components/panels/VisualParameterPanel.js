import React from 'react';
import styled from 'styled-components';
import Slider from '../controls/Slider';
import Checkbox from '../controls/Checkbox';
import ColorPicker from '../controls/ColorPicker';
import Dropdown from '../controls/Dropdown';

const VisualParametersPanel = ({ parameters }) => {
  return (
    <PanelContainer>
      <PanelHeader>Visual Parameters</PanelHeader>
      <ParameterList>
        {parameters.map(param => (
          <ParameterItem key={param.id}>
            {param.type === 'slider' && (
              <Slider
                id={param.id}
                label={param.label}
                value={param.value}
                min={param.min}
                max={param.max}
                step={param.step}
                onChange={value => console.log(`${param.id} changed to ${value}`)}
              />
            )}
            {param.type === 'checkbox' && (
              <Checkbox
                id={param.id}
                label={param.label}
                checked={param.value}
                onChange={value => console.log(`${param.id} changed to ${value}`)}
              />
            )}
            {param.type === 'color' && (
              <ColorPicker
                id={param.id}
                label={param.label}
                color={param.value}
                onChange={value => console.log(`${param.id} changed to ${value}`)}
              />
            )}
            {param.type === 'dropdown' && (
              <Dropdown
                id={param.id}
                label={param.label}
                value={param.value}
                options={param.options}
                onChange={value => console.log(`${param.id} changed to ${value}`)}
              />
            )}
          </ParameterItem>
        ))}
      </ParameterList>
    </PanelContainer>
  );
};

const PanelContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 15px;
  box-sizing: border-box;
`;

const PanelHeader = styled.h3`
  margin: 0 0 15px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  font-size: 16px;
  color: ${props => props.theme.colors.text};
`;

const ParameterList = styled.div`
  overflow-y: auto;
`;

const ParameterItem = styled.div`
  margin-bottom: 15px;
`;

export default VisualParametersPanel;
