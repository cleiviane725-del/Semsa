import { Link } from 'react-router-dom';
import { Heart, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <div className="h-24 w-24 rounded-full bg-primary-50 flex items-center justify-center mx-auto">
          <Heart className="h-12 w-12 text-primary-500" />
        </div>
        <h1 className="mt-6 text-3xl font-bold text-gray-900">Página não encontrada</h1>
        <p className="mt-2 text-base text-gray-600">
          A página que você está procurando não existe ou foi movida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="btn-primary inline-flex items-center gap-2"
          >
            <ArrowLeft size={18} />
            <span>Voltar para a página inicial</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;