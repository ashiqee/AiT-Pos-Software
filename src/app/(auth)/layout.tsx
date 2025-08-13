import React from 'react';

const AuthLayout = ({children}:{children:React.ReactNode}) => {
    return (
        <>
        <div className='flex justify-center dark:bg-slate-900/50 items-center h-screen'>
            {children}
        </div>
        </>
    );
};

export default AuthLayout;