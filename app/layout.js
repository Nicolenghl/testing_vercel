import './global.css';
import { Web3Provider } from './context/Web3Context';
import Navbar from './components/Navbar';

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>
                <Web3Provider>
                    <Navbar />
                    {children}
                </Web3Provider>
            </body>
        </html>
    );
} 