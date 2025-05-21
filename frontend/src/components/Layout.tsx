import Navbar from './Navbar';

const Layout = ({ children }: { children: React.ReactNode }) => {
    return (
        <>
            <Navbar />
            <div className="container pt-4">
                {children}
            </div>
        </>
    );
};

export default Layout;
