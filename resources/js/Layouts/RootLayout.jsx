import Navbar from '@/Components/Navbar';

export default function RootLayout({ children }) {
    return (
        <div className="App">
            <Navbar />
            {children}
        </div>
    );
}
