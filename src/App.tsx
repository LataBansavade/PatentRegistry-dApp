import Navbar from "./Components/Navbar";
import AllPatent from "./Components/AllPatent";
import CreatePatent from "./Components/CreatePatent";
import MyPatents from "./Components/MyPatents";
import { Routes, Route } from 'react-router-dom';
import { Toaster } from "react-hot-toast";
import Web3Uploader from "./Components/Web3Uploader";

const App = () => {
  return (
    <div className="h-[100vh] bg-black overflow-y-auto">
      <Navbar />
      <Routes>
        <Route path="/" element={<AllPatent />} />
        <Route path="/create" element={<CreatePatent />} />
        <Route path="/my-patents" element={<MyPatents />} />
        <Route path="/web3Uploader" element={<Web3Uploader />} />
      </Routes>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '10px'
          },
          error: {
            duration: 3000
          }
        }}
      />
    </div>
  );
};

export default App;