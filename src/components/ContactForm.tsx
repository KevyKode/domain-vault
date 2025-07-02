import React, { useState } from 'react'
import { X, Send, CheckCircle, AlertCircle } from 'lucide-react'
import { supabase, type Domain } from '../lib/supabase'

interface ContactFormProps {
  isOpen: boolean
  onClose: () => void
  selectedDomain?: Domain
}

export default function ContactForm({ isOpen, onClose, selectedDomain }: ContactFormProps) {
  const [formData, setFormData] = useState({
    buyer_name: '',
    buyer_email: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDomain) return
    
    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      const { error } = await supabase
        .from('inquiries')
        .insert([{
          domain_id: selectedDomain.id,
          seller_id: selectedDomain.seller_id,
          buyer_name: formData.buyer_name,
          buyer_email: formData.buyer_email,
          message: formData.message,
          status: 'new'
        }])

      if (error) throw error

      setSubmitStatus('success')
      setFormData({ buyer_name: '', buyer_email: '', message: '' })
      
      setTimeout(() => {
        onClose()
        setSubmitStatus('idle')
      }, 2000)
    } catch (error) {
      console.error('Error submitting inquiry:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900">
            Domain Inquiry
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {selectedDomain && (
            <div className="bg-blue-50 rounded-xl p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Interested Domain:</h4>
              <div className="flex items-center justify-between">
                <span className="text-blue-800 font-medium">{selectedDomain.name}</span>
                <span className="text-green-600 font-bold">${selectedDomain.price.toLocaleString()}</span>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="buyer_name" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              id="buyer_name"
              required
              value={formData.buyer_name}
              onChange={(e) => setFormData({ ...formData, buyer_name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label htmlFor="buyer_email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              id="buyer_email"
              required
              value={formData.buyer_email}
              onChange={(e) => setFormData({ ...formData, buyer_email: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              Message *
            </label>
            <textarea
              id="message"
              required
              rows={4}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500 transition-all resize-none"
              placeholder="Tell us about your project and how you plan to use this domain..."
            />
          </div>

          {submitStatus === 'success' && (
            <div className="flex items-center p-4 bg-green-50 rounded-xl text-green-800">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span>Inquiry submitted successfully! The seller will be in touch soon.</span>
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="flex items-center p-4 bg-red-50 rounded-xl text-red-800">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span>Error submitting inquiry. Please try again.</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || submitStatus === 'success'}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center"
          >
            {isSubmitting ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
            ) : (
              <>
                <Send className="h-5 w-5 mr-2" />
                Send Inquiry
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}