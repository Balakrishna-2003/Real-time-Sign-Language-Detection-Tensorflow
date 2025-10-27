import React from 'react'
import { GoGear } from "react-icons/go";

export default function Navbar() {
  return (
    <nav className='mainnav'>
        <img src='./logo1.png' height="45px" width="45px" style={{marginRight: "10px"}} />
        <div className='titleDiv'>
            <h1 className='inter-font-title'>Major Project</h1>
            <h1 className='inter-font-desc'>Real-time Hand Sign Translation</h1>
        </div>
        <div className='settingIcon'>
            <GoGear className='img' style={{height: "24px", width:"24px", margin:"7px"}}/>
        </div>
    </nav>
  )
}
