import React from 'react';
import styled from 'styled-components';

const Slider = ({ id, label, value, min, max, step, onChange }) => {
  return (
    <SliderContainer>
      <SliderLabel htmlFor={id}>{label}</SliderLabel>
      <SliderWrapper>
        <SliderInput
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
        />
        <SliderValue>{value}</SliderValue>
      </SliderWrapper>
    </SliderContainer>
  );
};

const SliderContainer = styled.div`
  margin-bottom: 12px;
`;

const SliderLabel = styled.label`
  display: block;
  font-size: 14px;
  margin-bottom: 6px;
  color: ${props => props.theme.colors.text};
`;

const SliderWrapper = styled.div`
  display: flex;
  align-items: center;
`;

const SliderInput = styled.input`
  flex: 1;
  height: 6px;
  -webkit-appearance: none;
  background: ${props => props.theme.colors.border};
  border-radius: 3px;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: ${props => props.theme.colors.accent};
    cursor: pointer;
  }
  
  &::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: ${props => props.theme.colors.accent};
    cursor: pointer;
    border: none;
  }
  
  &:focus {
    outline: none;
  }
`;

const SliderValue = styled.span`
  width: 40px;
  text-align: right;
  margin-left: 10px;
  font-size: 14px;
  color: ${props => props.theme.colors.textSecondary};
`;

export default Slider;
