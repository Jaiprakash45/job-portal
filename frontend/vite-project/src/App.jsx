import { useState } from 'react'

import './App.css'
import Navbar from './component/shared/Navbar'

function App() {
  const [count, setCount] = useState(0)

  return (
    

    <>
    <h1>lets build something amazing</h1>
    <Navbar />
    </>


  )
}

export default App
