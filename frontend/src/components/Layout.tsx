import Navbar from './Navbar';

const Layout = ({ children }: { children: React.ReactNode }) => {
    return (
        <>
            <Navbar />
            <div className="container" style={{ paddingTop: '2.5rem' }}>
                {children}
            </div>
        </>
    );
};

export default Layout;
