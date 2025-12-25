
import React from 'react';

interface MainContentAreaProps {
  children: React.ReactNode;
}

const MainContentArea: React.FC<MainContentAreaProps> = ({ children }) => {
  return (
    <main className="flex-1 bg-[#02040a] relative min-w-0 z-10 overflow-y-auto custom-scrollbar">
      <div className="h-full w-full">
        {children}
      </div>
    </main>
  );
};

export default MainContentArea;
