import React, { useState, useEffect } from 'react';
import { Book, Award, Users, Clock, Target, TrendingUp, FileText, Play } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  duration: number;
  level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  language: string;
  rating: number;
  students: number;
  certificate: boolean;
  modules: Module[];
  price: number;
  currency: string;
}

interface Module {
  id: string;
  title: string;
  duration: number;
  completed: boolean;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'text' | 'quiz';
  duration: number;
  completed: boolean;
}

interface UserProgress {
  userId: string;
  courseId: string;
  completedModules: string[];
  totalScore: number;
  certificateIssued: boolean;
  enrollmentDate: Date;
  completionDate?: Date;
}

interface DigitalCertificate {
  id: string;
  userName: string;
  courseName: string;
  issueDate: Date;
  blockchainHash: string;
  verificationCode: string;
  validUntil: Date;
}

const AfricanDigitalEducation: React.FC = () => {
  const [courses] = useState<Course[]>([
    {
      id: '1',
      title: 'Gestion d\'Entreprise pour Artisans',
      description: 'Apprenez à gérer votre entreprise artisanale avec succès',
      instructor: 'Mamadou Diallo',
      duration: 120,
      level: 'beginner',
      category: 'Entrepreneuriat',
      language: 'Français',
      rating: 4.8,
      students: 1250,
      certificate: true,
      price: 25000,
      currency: 'FCFA',
      modules: [
        {
          id: '1',
          title: 'Introduction à la gestion d\'entreprise',
          duration: 30,
          completed: false,
          lessons: [
            { id: '1', title: 'Qu\'est-ce qu\'une entreprise?', type: 'video', duration: 15, completed: false },
            { id: '2', title: 'Les types d\'entreprises', type: 'text', duration: 10, completed: false },
            { id: '3', title: 'Quiz: Concepts de base', type: 'quiz', duration: 5, completed: false }
          ]
        },
        {
          id: '2',
          title: 'Gestion financière simple',
          duration: 45,
          completed: false,
          lessons: [
            { id: '4', title: 'Tenue des livres', type: 'video', duration: 20, completed: false },
            { id: '5', title: 'Calcul des profits', type: 'video', duration: 15, completed: false },
            { id: '6', title: 'Quiz: Finances', type: 'quiz', duration: 10, completed: false }
          ]
        }
      ]
    },
    {
      id: '2',
      title: 'Agriculture Numérique Moderne',
      description: 'Techniques agricoles modernes adaptées au contexte africain',
      instructor: 'Dr. Aminata Sarr',
      duration: 180,
      level: 'intermediate',
      category: 'Agriculture',
      language: 'Français',
      rating: 4.9,
      students: 890,
      certificate: true,
      price: 35000,
      currency: 'FCFA',
      modules: [
        {
          id: '3',
          title: 'Agriculture de précision',
          duration: 60,
          completed: false,
          lessons: [
            { id: '7', title: 'Capteurs et IoT', type: 'video', duration: 25, completed: false },
            { id: '8', title: 'Analyse des données', type: 'text', duration: 20, completed: false },
            { id: '9', title: 'Applications pratiques', type: 'video', duration: 15, completed: false }
          ]
        }
      ]
    },
    {
      id: '3',
      title: 'Commerce Transfrontalier en Afrique',
      description: 'Maîtrisez les réglementations et opportunités du commerce régional',
      instructor: 'Oumar Koné',
      duration: 90,
      level: 'advanced',
      category: 'Commerce',
      language: 'Français',
      rating: 4.7,
      students: 567,
      certificate: true,
      price: 45000,
      currency: 'FCFA',
      modules: [
        {
          id: '4',
          title: 'Réglementations douanières',
          duration: 40,
          completed: false,
          lessons: [
            { id: '10', title: 'Zones de libre-échange', type: 'video', duration: 20, completed: false },
            { id: '11', title: 'Procédures douanières', type: 'text', duration: 15, completed: false },
            { id: '12', title: 'Quiz: Douanes', type: 'quiz', duration: 5, completed: false }
          ]
        }
      ]
    }
  ]);

  const [userProgress] = useState<UserProgress[]>([
    {
      userId: 'user1',
      courseId: '1',
      completedModules: ['1'],
      totalScore: 85,
      certificateIssued: false,
      enrollmentDate: new Date('2024-01-15'),
      completionDate: undefined
    }
  ]);

  const [certificates] = useState<DigitalCertificate[]>([
    {
      id: 'cert1',
      userName: 'Fatou Diallo',
      courseName: 'Gestion d\'Entreprise pour Artisans',
      issueDate: new Date('2024-02-01'),
      blockchainHash: '0x7a8b9c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b',
      verificationCode: 'CERT-2024-AB123',
      validUntil: new Date('2027-02-01')
    }
  ]);

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activeTab, setActiveTab] = useState<'courses' | 'progress' | 'certificates'>('courses');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');

  const categories = ['all', 'Entrepreneuriat', 'Agriculture', 'Commerce', 'Technologie', 'Artisanat'];
  const levels = ['all', 'beginner', 'intermediate', 'advanced'];

  const getLevelColor = (level: string): string => {
    switch (level) {
      case 'beginner': return 'text-green-600 bg-green-100';
      case 'intermediate': return 'text-yellow-600 bg-yellow-100';
      case 'advanced': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getLevelLabel = (level: string): string => {
    switch (level) {
      case 'beginner': return 'Débutant';
      case 'intermediate': return 'Intermédiaire';
      case 'advanced': return 'Avancé';
      default: return level;
    }
  };

  const getLessonTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Play className="w-4 h-4" />;
      case 'text': return <Book className="w-4 h-4" />;
      case 'quiz': return <Target className="w-4 h-4" />;
      default: return <Book className="w-4 h-4" />;
    }
  };

  const filteredCourses = courses.filter(course => {
    const categoryMatch = selectedCategory === 'all' || course.category === selectedCategory;
    const levelMatch = selectedLevel === 'all' || course.level === selectedLevel;
    return categoryMatch && levelMatch;
  });

  const calculateProgress = (courseId: string): number => {
    const progress = userProgress.find(p => p.courseId === courseId);
    if (!progress) return 0;
    
    const course = courses.find(c => c.id === courseId);
    if (!course) return 0;
    
    return (progress.completedModules.length / course.modules.length) * 100;
  };

  const formatCurrency = (amount: number, currency: string): string => {
    return amount.toLocaleString() + ' ' + currency;
  };

  const enrollInCourse = (courseId: string) => {
    alert(`Inscription au cours ${courseId} - Intégration avec paiement mobile africain`);
  };

  const verifyCertificate = (certificateId: string) => {
    alert(`Vérification du certificat ${certificateId} sur la blockchain`);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Éducation Numérique Africaine</h1>
        <p className="text-lg text-gray-600">Formation professionnelle et certification numérique adaptées au contexte africain</p>
      </div>

      {/* Navigation */}
      <div className="flex justify-center mb-8">
        <div className="bg-white rounded-lg p-1 shadow-lg">
          <button
            onClick={() => setActiveTab('courses')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'courses'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <Book className="w-5 h-5 inline mr-2" />
            Cours
          </button>
          <button
            onClick={() => setActiveTab('progress')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'progress'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <TrendingUp className="w-5 h-5 inline mr-2" />
            Progrès
          </button>
          <button
            onClick={() => setActiveTab('certificates')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'certificates'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <FileText className="w-5 h-5 inline mr-2" />
            Certificats
          </button>
        </div>
      </div>

      {/* Cours disponibles */}
      {activeTab === 'courses' && (
        <div>
          {/* Filtres */}
          <div className="mb-6 flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'Toutes catégories' : category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Niveau</label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {levels.map((level) => (
                  <option key={level} value={level}>
                    {level === 'all' ? 'Tous niveaux' : getLevelLabel(level)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <div key={course.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{course.title}</h3>
                    <p className="text-gray-600 text-sm">{course.description}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${getLevelColor(course.level)}`}>
                    {getLevelLabel(course.level)}
                  </span>
                </div>

                <div className="mb-4">
                  <p className="text-gray-500 text-sm mb-1">Instructeur</p>
                  <p className="font-medium">{course.instructor}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-gray-500">Durée</p>
                    <p className="font-medium">{course.duration} min</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Élèves</p>
                    <p className="font-medium">{course.students}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Langue</p>
                    <p className="font-medium">{course.language}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Note</p>
                    <p className="font-medium">{course.rating}/5 ⭐</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-gray-500 text-sm mb-2">Modules</p>
                  <div className="space-y-1">
                    {course.modules.slice(0, 2).map((module) => (
                      <div key={module.id} className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        <span>{module.title}</span>
                        <span className="text-gray-500">({module.duration} min)</span>
                      </div>
                    ))}
                    {course.modules.length > 2 && (
                      <p className="text-sm text-gray-500 ml-4">+{course.modules.length - 2} autres modules</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center mb-4">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(course.price, course.currency)}
                    </p>
                    {course.certificate && (
                      <div className="flex items-center gap-1 text-sm text-green-600">
                        <Award className="w-4 h-4" />
                        <span>Certificat inclus</span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedCourse(course);
                    enrollInCourse(course.id);
                  }}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                >
                  S\'inscrire
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progrès des étudiants */}
      {activeTab === 'progress' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold mb-4">Vos Progrès</h2>
          
          {userProgress.map((progress) => {
            const course = courses.find(c => c.id === progress.courseId);
            if (!course) return null;
            
            return (
              <div key={progress.userId} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">{course.title}</h3>
                    <p className="text-gray-600">Instructeur: {course.instructor}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      {calculateProgress(progress.courseId).toFixed(0)}%
                    </div>
                    <p className="text-sm text-gray-500">Complété</p>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${calculateProgress(progress.courseId)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-gray-500 text-sm">Score total</p>
                    <p className="text-lg font-semibold">{progress.totalScore}/100</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Modules complétés</p>
                    <p className="text-lg font-semibold">
                      {progress.completedModules.length}/{course.modules.length}
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-medium mb-3">Modules en cours</h4>
                  <div className="space-y-3">
                    {course.modules.map((module) => (
                      <div key={module.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <h5 className="font-medium">{module.title}</h5>
                          <span className="text-sm text-gray-500">{module.duration} min</span>
                        </div>
                        <div className="space-y-2">
                          {module.lessons.map((lesson) => (
                            <div key={lesson.id} className="flex items-center gap-3 text-sm">
                              <div className={`w-4 h-4 rounded-full ${
                                lesson.completed ? 'bg-green-500' : 'bg-gray-300'
                              }`}></div>
                              {getLessonTypeIcon(lesson.type)}
                              <span className={lesson.completed ? 'line-through text-gray-500' : ''}>
                                {lesson.title}
                              </span>
                              <span className="text-gray-500 ml-auto">{lesson.duration} min</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700">
                  Continuer l\'apprentissage
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Certificats numériques */}
      {activeTab === 'certificates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((certificate) => (
            <div key={certificate.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Certificat de Réussite</h3>
                <p className="text-gray-600">{certificate.courseName}</p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-500">Titulaire:</span>
                  <span className="font-medium">{certificate.userName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date d\'émission:</span>
                  <span className="font-medium">{certificate.issueDate.toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Valide jusqu\'à:</span>
                  <span className="font-medium">{certificate.validUntil.toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Code de vérification:</span>
                  <span className="font-mono text-sm">{certificate.verificationCode}</span>
                </div>
              </div>

              <div className="mb-4 p-3 bg-gray-100 rounded-lg">
                <p className="text-xs text-gray-600 font-mono break-all">
                  Hash Blockchain:<br/>
                  {certificate.blockchainHash}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => verifyCertificate(certificate.id)}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                >
                  Vérifier
                </button>
                <button className="bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700">
                  Télécharger
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AfricanDigitalEducation;