import React, { useState } from 'react';
import styled from 'styled-components';
import MobileHeader from '../mobile/MobileHeader';
import MobileTabBar from '../mobile/MobileTabBar';
import ParameterSelectionBar from '../mobile/ParameterSelectionBar';
import MobilePriorityControlsBar from '../mobile/MobilePriorityControlsBar';
import VisualizationCanvas from '../canvas/VisualizationCanvas';
import ParameterModal from '../mobile/ParameterModal';
import { dummyData } from '../../data/dummyData';

const MobileLayout = () => {
  const [activeTab, setActiveTab] = useState(null);
  
  const closeModal = () => setActiveTab(null);

  return (
    <LayoutContainer>
      <MobileHeader 
        pluginName={dummyData.activePlugin.name}
      />
      
      <ParameterSelectionBar 
        options={dummyData.selectionParameters}
      />
      
      <CanvasContainer>
        <VisualizationCanvas />
      </CanvasContainer>
      
      <MobilePriorityControlsBar 
        controls={dummyData.priorityControls} 
      />
      
      <MobileTabBar 
        onTabSelect={setActiveTab} 
        activeTab={activeTab}
      />
      
      {activeTab === 'visual' && (
        <ParameterModal
          title="Visual Parameters"
          parameters={dummyData.visualParameters}
          onClose={closeModal}
        />
      )}
      
      {activeTab === 'structural' && (
        <ParameterModal
          title="Structural Parameters"
          parameters={dummyData.structuralParameters}
          onClose={closeModal}
        />
      )}
      
      {activeTab === 'actions' && (
        <ParameterModal
          title="Actions"
          actions={dummyData.actions}
          onClose={closeModal}
        />
      )}
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

const CanvasContainer = styled.div`
  flex: 1;
  overflow: hidden;
  background: ${props => props.theme.colors.canvasBackground};
`;

export default MobileLayout;
