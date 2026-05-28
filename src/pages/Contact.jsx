import React, { useState } from 'react';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Message envoyé avec succès ! Nous vous répondrons dans les plus brefs délais.');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div style={{
      minHeight: '80vh',
      padding: '2rem',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <h1 style={{
        fontSize: '2.5rem',
        color: '#1a5f3f',
        marginBottom: '2rem',
        textAlign: 'center'
      }}>
        Contactez-nous
      </h1>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '3rem'
      }}>
        <div>
          <h2 style={{ color: '#1a5f3f', marginBottom: '1rem' }}>Nos Coordonnées</h2>
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>📧 contact@mangootech.com</p>
            <p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>📱 +221 XX XXX XX XX</p>
            <p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>📍 Dakar, Sénégal</p>
          </div>
          
          <h3 style={{ color: '#1a5f3f', marginBottom: '1rem' }}>Horaires</h3>
          <p style={{ color: '#6b7280' }}>
            Lundi - Vendredi: 8h00 - 18h00<br/>
            Samedi: 9h00 - 15h00<br/>
            Dimanche: Fermé
          </p>
        </div>
        
        <form onSubmit={handleSubmit} style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', color: '#374151', marginBottom: '0.5rem' }}>
              Nom complet *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '1rem'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', color: '#374151', marginBottom: '0.5rem' }}>
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '1rem'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', color: '#374151', marginBottom: '0.5rem' }}>
              Sujet *
            </label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '1rem'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', color: '#374151', marginBottom: '0.5rem' }}>
              Message *
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows="5"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '1rem',
                resize: 'vertical'
              }}
            />
          </div>
          
          <button
            type="submit"
            style={{
              backgroundColor: '#1a5f3f',
              color: 'white',
              border: 'none',
              padding: '0.75rem 2rem',
              borderRadius: '0.375rem',
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              width: '100%'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#14532d';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#1a5f3f';
            }}
          >
            Envoyer le message
          </button>
        </form>
      </div>
    </div>
  );
};

export default Contact;