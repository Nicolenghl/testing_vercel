
import Navbar from './components/Navbar';
   
export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-green-100">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-green-900 sm:text-6xl">
            Welcome to GreenDish - Sustainable Dining Platform
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            A revolutionary platform connecting eco-conscious diners with sustainable restaurants.
            Earn rewards while reducing your carbon footprint.
          </p>
        </div>
      </div>
    </main>
  );
}