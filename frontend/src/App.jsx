import { useState } from 'react'
import './App.css'
import Demo from './Demo.jsx';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard.jsx'

function App() {
  return (
    <div className="App">
      <Routes>
        <Route index element={<Demo/>} />
        <Route path='/Dashboard' element={<Dashboard/>} />
      </Routes>
    </div>
  )
}

export default App