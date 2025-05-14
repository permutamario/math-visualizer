import React, { useState } from 'react';
import styled from 'styled-components';
import Toolbar from '../toolbar/Toolbar';
import VisualParametersPanel from '../panels/VisualParametersPanel';
import StructuralParametersPanel from '../panels/StructuralParametersPanel';
import SelectionParametersPanel from '../panels/SelectionParametersPanel';
import ActionsPanel from '../panels/ActionsPanel';
import PriorityControlsBar from '../controls/PriorityControlsBar';
import VisualizationCanvas from '../canvas/VisualizationCanvas';
import { dummyData } from '../../data/dummyData';

const DesktopLayout = () => {
  const [collapsed, setCollapsed] = useState({
    visualParams: false,
    structuralParams: false,
    selectionParams: false,
    actions: false,
    priorityControls: false
  });

  const toggleCollapse = (panel) => {
    setCollapsed({
      ...collapsed,
      [panel]: !collapsed[panel]
    });
  };

  return (
    <LayoutContainer>
      <ToolbarWrapper>
        <Toolbar 
          pluginName={dummyData.activePlugin.name} 
          plugins={dummyData.plugins} 
        />
      </ToolbarWrapper>
      
      <MainContent>
        <LeftSidebar $collapsed={collapsed.visualParams}>
          <CollapseButton 
            onClick={() => toggleCollapse('visualParams')}
          >
            {collapsed.visualParams ? '>' : '<'}
          </CollapseButton>
          {!collapsed.visualParams && (
            <VisualParametersPanel parameters={dummyData.visualParameters} />
          )}
        </LeftSidebar>
        
        <CenterArea>
          <VisualizationCanvas />
        </CenterArea>
        
        <RightSidebar>
          <TopRight $collapsed={collapsed.selectionParams}>
            <CollapseButton 
              onClick={() => toggleCollapse('selectionParams')}
            >
              {collapsed.selectionParams ? '<' : '>'}
            </CollapseButton>
            {!collapsed.selectionParams && (
              <SelectionParametersPanel selections={dummyData.selectionParameters} />
            )}
          </TopRight>
          
          <BottomRight $collapsed={collapsed.structuralParams}>
            <CollapseButton 
              onClick={() => toggleCollapse('structuralParams')}
            >
              {collapsed.structuralParams ? '<' : '>'}
            </CollapseButton>
            {!collapsed.structuralParams && (
              <StructuralParametersPanel parameters={dummyData.structuralParameters} />
            )}
          </BottomRight>
        </RightSidebar>
      </MainContent>
      
      <BottomArea>
        <BottomLeft $collapsed={collapsed.actions}>
          <CollapseButton 
            onClick={() => toggleCollapse('actions')}
          >
            {collapsed.actions ? 'v' : '^'}
          </CollapseButton>
          {!collapsed.actions && (
            <ActionsPanel actions={dummyData.actions} />
          )}
        </BottomLeft>
        
        <BottomCenter $collapsed={collapsed.priorityControls}>
          <CollapseButton 
            onClick={() => toggleCollapse('priorityControls')}
          >
            {collapsed.priorityControls ? 'v' : '^'}
          </CollapseButton>
          {!collapsed.priorityControls && (
            <PriorityControlsBar controls={dummyData.priorityControls} />
          )}
        </BottomCenter>
      </BottomArea>
    </LayoutContainer>
  );
};

const LayoutContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
`;

const ToolbarWrapper = styled.div`
  height: 50px;
  width: 100%;
`;

const MainContent = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`;

const LeftSidebar = styled.div`
  width: ${props => props.$collapsed ? '30px' : '300px'};
  transition: width 0.3s ease;
  background: ${props => props.theme.colors.panelBackground};
  border-right: 1px solid ${props => props.theme.colors.border};
  position: relative;
  overflow: ${props => props.$collapsed ? 'hidden' : 'auto'};
`;

const CenterArea = styled.div`
  flex: 1;
  overflow: hidden;
  background: ${props => props.theme.colors.canvasBackground};
`;

const RightSidebar = styled.div`
  width: 300px;
  display: flex;
  flex-direction: column;
  border-left: 1px solid ${props => props.theme.colors.border};
`;

const TopRight = styled.div`
  height: ${props => props.$collapsed ? '30px' : '40%'};
  transition: height 0.3s ease;
  background: ${props => props.theme.colors.panelBackground};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  position: relative;
  overflow: ${props => props.$collapsed ? 'hidden' : 'auto'};
`;

const BottomRight = styled.div`
  flex: 1;
  background: ${props => props.theme.colors.panelBackground};
  position: relative;
  overflow: ${props => props.$collapsed ? 'hidden' : 'auto'};
`;

const BottomArea = styled.div`
  display: flex;
  height: 150px;
  border-top: 1px solid ${props => props.theme.colors.border};
`;

const BottomLeft = styled.div`
  width: 300px;
  height: ${props => props.$collapsed ? '30px' : '150px'};
  transition: height 0.3s ease;
  background: ${props => props.theme.colors.panelBackground};
  border-right: 1px solid ${props => props.theme.colors.border};
  position: relative;
  overflow: ${props => props.$collapsed ? 'hidden' : 'auto'};
`;

const BottomCenter = styled.div`
  flex: 1;
  height: ${props => props.$collapsed ? '30px' : '150px'};
  transition: height 0.3s ease;
  background: ${props => props.theme.colors.panelBackground};
  position: relative;
  overflow: ${props => props.$collapsed ? 'hidden' : 'auto'};
`;

const CollapseButton = styled.button`
  position: absolute;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.theme.colors.accent};
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  z-index: 10;
  top: 5px;
  right: 5px;
  font-size: 10px;
  
  &:hover {
    background: ${props => props.theme.colors.accentHover};
  }
`;

export default DesktopLayout;
