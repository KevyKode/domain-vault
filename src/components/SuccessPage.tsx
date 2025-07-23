import React, { useEffect, useState } from 'react'
import { CheckCircle, ArrowRight, Home } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function SuccessPage() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className={`max-w-md w-full transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="bg-green-100 rounded-full p-4 inline-block mb-6">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Payment Successful!
          </h1>
          
          <p className="text-gray-600 mb-8 leading-relaxed">
            Thank you for your purchase. Your payment has been processed successfully and you should receive a confirmation email shortly.
          </p>

          <div className="space-y-4">
            <Link
              to="/"
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center group"
            >
              <Home className="h-5 w-5 mr-2" />
              Return to Homepage
              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}