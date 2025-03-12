import React from 'react'
import "../globals.css"

const layout = ({children}: {children: React.ReactNode}) => {
  return (
    <div>
      {children}
    </div>
  );
}

export default layout