import React, { useState } from 'react';

function SetupScreen({ onGameStart }) {
  const [projectile, setProjectile] = useState('cicek');
  const [targetImg, setTargetImg] = useState(null);

  const handleStart = () => {
    onGameStart({ projectile, targetImg });
  };

  const handleImageUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      setTargetImg(URL.createObjectURL(e.target.files[0]));
    }
  };

  return (
    <div className="container text-center mt-5">
      <h1>Çiçek Dalı</h1>
      <div className="my-4">
        <h2>Atılacak Objeyi Seç</h2>
        <div className="d-flex justify-content-center">
          <button 
            className={`btn ${projectile === 'cicek' ? 'btn-primary' : 'btn-outline-primary'} mx-2`} 
            onClick={() => setProjectile('cicek')}
          >
            Çiçek 🌸
          </button>
          <button 
            className={`btn ${projectile === 'saksi' ? 'btn-primary' : 'btn-outline-primary'} mx-2`} 
            onClick={() => setProjectile('saksi')}
          >
            Saksı 🪴
          </button>
        </div>
      </div>
      <div className="my-4">
        <h2>Hedef Resmini Yükle (İsteğe Bağlı)</h2>
        <p>Yüklemezseniz varsayılan hedef kullanılacaktır.</p>
        <input type="file" className="form-control w-50 mx-auto" onChange={handleImageUpload} accept="image/*" />
      </div>
      {targetImg && <img src={targetImg} alt="Hedef Önizleme" className="img-thumbnail w-25 my-3" />}
      <div className="my-4">
        <button className="btn btn-success btn-lg" onClick={handleStart}>Oyunu Başlat</button>
      </div>
    </div>
  );
}

export default SetupScreen;