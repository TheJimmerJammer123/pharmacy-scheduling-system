import { DraggableStoreScheduling } from "./StoreScheduling/DraggableStoreScheduling";
import { ImprovedStoreScheduling } from "./StoreScheduling/ImprovedStoreScheduling";

interface StoreSchedulingProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const StoreScheduling = ({ activeTab, setActiveTab }: StoreSchedulingProps) => {
  // Use improved version - switch between them for comparison
  return <ImprovedStoreScheduling activeTab={activeTab} setActiveTab={setActiveTab} />;
  // return <DraggableStoreScheduling activeTab={activeTab} setActiveTab={setActiveTab} />;
}; 