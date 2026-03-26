import { Routes, Route } from 'react-router-dom';


// Import route fragments from modules
// import { HomeRoutes } from '../../modules/home';
// import { UserRoutes } from '../../modules/user';
// import { BookRoutes } from '../../modules/book';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<div>Nhom02_KTvTKPM_DHKTPM18A_Frontend - Skeleton</div>} />
      
      {/* Route fragments will be mounted here
      <HomeRoutes />
      <UserRoutes />
      <BookRoutes />
      ...
      */}
      
      {/* Fallback */}
      <Route path="*" element={<div>404 - Not Found</div>} />
    </Routes>
  );
};

export default AppRoutes;
