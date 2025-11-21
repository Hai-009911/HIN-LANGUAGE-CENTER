import React, { useState, useEffect, useRef } from 'react';
import Button from '../../components/ui/Button';
import { 
  hinLogo, 
  logoInnovate, logoQuantum, logoApex, logoZenith,
  featureStudentUI, featureTeacherUI, featureAdminUI,
  logoGoogleClassroom, logoZoom, logoSlack,
  logoEdtechWeekly, logoLearnMagazine
} from '../../assets/images';
import { UserRole } from '../../types';

interface LandingPageProps {
  onLoginClick: () => void;
}

const PEXELS_API_KEY = 'Tnc81iXKbDI8Y1lf20hIqoVNZcKW6UMdxbJNXcKQGAC2EsZEj5Ach6Kk';

// Hook for scroll-triggered animations
const useIntersectionObserver = (options: IntersectionObserverInit) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        if (containerRef.current) {
            observer.unobserve(containerRef.current);
        }
      }
    }, options);

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [containerRef, options]);

  return [containerRef, isVisible] as const;
};

// Hook for counting up animation
const useCountUp = (end: number, duration = 2000) => {
    const [count, setCount] = useState(0);
    const [ref, isVisible] = useIntersectionObserver({ threshold: 0.5 });

    useEffect(() => {
        if (isVisible) {
            let start = 0;
            const stepTime = Math.abs(Math.floor(duration / end));
            const timer = setInterval(() => {
                start += 1;
                setCount(start);
                if (start === end) {
                    clearInterval(timer);
                }
            }, stepTime);
            return () => clearInterval(timer);
        }
    }, [isVisible, end, duration]);
    
    return [ref, count] as const;
};


const AnimatedSection: React.FC<{children: React.ReactNode; className?: string}> = ({ children, className }) => {
    const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1 });
    return (
        <div ref={ref} className={`scroll-reveal ${isVisible ? 'visible' : ''} ${className}`}>
            {children}
        </div>
    );
};

const TestimonialCard: React.FC<{quote: string; name: string; role: string;}> = ({quote, name, role}) => (
    <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200/80 mx-2 h-full flex flex-col">
         <div className="text-hin-orange mb-4 text-2xl">★★★★★</div>
        <p className="text-gray-700 mb-6 text-lg italic flex-grow">"{quote}"</p>
        <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-hin-blue-100 flex items-center justify-center font-bold text-hin-blue-700 mr-4">{name.charAt(0)}</div>
            <div>
                <p className="font-semibold text-hin-blue-900">{name}</p>
                <p className="text-sm text-gray-500">{role}</p>
            </div>
        </div>
    </div>
);


const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick }) => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [isYearly, setIsYearly] = useState(false);
  const [activeFeatureTab, setActiveFeatureTab] = useState<UserRole>(UserRole.STUDENT);

   useEffect(() => {
    const fetchImage = async () => {
        try {
            const response = await fetch('https://api.pexels.com/v1/search?query=modern classroom diverse students learning&orientation=landscape&per_page=1', {
                headers: {
                    Authorization: PEXELS_API_KEY
                }
            });
            if (!response.ok) throw new Error('Failed to fetch image');
            const data = await response.json();
            if (data.photos && data.photos.length > 0) {
                setHeroImage(data.photos[0].src.large2x);
            }
        } catch (error) {
            console.error("Pexels API error:", error);
        }
    };
    fetchImage();
  }, []);
  
  const testimonials = [
      { quote: "Nền tảng này đã thay đổi hoàn toàn cách tôi quản lý các lớp học của mình. Nó trực quan, tiết kiệm thời gian và học viên của tôi rất thích nó!", name: "Cô Alice", role: "Giáo viên Tiếng Anh" },
      { quote: "Là một học viên, tôi thấy việc theo dõi bài tập và điểm số của mình chưa bao giờ dễ dàng hơn thế. Giao diện rất thân thiện với người dùng!", name: "Bob Johnson", role: "Học viên"},
      { quote: "Với tư cách là quản trị viên, tôi có cái nhìn tổng quan tuyệt vời về mọi hoạt động trong trung tâm. Việc tạo báo cáo thật dễ dàng.", name: "Admin User", role: "Quản trị viên" }
  ];
  
  const [studentsRef, studentsCount] = useCountUp(1200);
  const [teachersRef, teachersCount] = useCountUp(75);
  const [classesRef, classesCount] = useCountUp(50);

  const [howItWorksRef, isHowItWorksVisible] = useIntersectionObserver({ threshold: 0.5 });
  
  const featureContent = {
    [UserRole.STUDENT]: {
        image: featureStudentUI,
        title: "Trao quyền cho Học viên",
        description: "Cung cấp cho học viên các công cụ cần thiết để thành công với một cổng thông tin được cá nhân hóa.",
        features: ["Truy cập bài tập và tài liệu", "Nộp bài trực tuyến dễ dàng", "Theo dõi điểm số và phản hồi", "Xem lịch học và hạn chót"]
    },
    [UserRole.TEACHER]: {
        image: featureTeacherUI,
        title: "Đơn giản hóa việc Giảng dạy",
        description: "Tối ưu hóa quy trình làm việc của giáo viên để họ có thể tập trung vào điều quan trọng nhất: giảng dạy.",
        features: ["Tạo và quản lý bài tập", "Chấm điểm và cung cấp phản hồi", "Quản lý điểm danh tự động", "Giao tiếp với học viên và phụ huynh"]
    },
    [UserRole.ADMIN]: {
        image: featureAdminUI,
        title: "Quản lý Trung tâm Hiệu quả",
        description: "Một cái nhìn tổng quan mạnh mẽ để quản lý mọi khía cạnh của trung tâm ngôn ngữ của bạn.",
        features: ["Quản lý người dùng và vai trò", "Tạo và quản lý lớp học", "Xem báo cáo và phân tích chi tiết", "Tùy chỉnh cài đặt hệ thống"]
    }
  };

  const activeFeature = featureContent[activeFeatureTab];

  return (
    <div className="bg-hin-beige-50 min-h-screen text-hin-blue-900 overflow-hidden">
      <header className="sticky top-0 p-4 bg-white/70 backdrop-blur-lg z-50 border-b border-gray-200/80">
        <div className="container mx-auto flex justify-between items-center">
          <img src={hinLogo} alt="Hin Logo" className="h-7" />
          <Button onClick={onLoginClick} variant="primary">
            Đăng nhập / Đăng ký
          </Button>
        </div>
      </header>
      
      <main className="container mx-auto px-6 py-16 lg:py-24 relative">
         <div className="blob-container">
            <div className="blob blob1"></div>
            <div className="blob blob2"></div>
        </div>
        <div className="grid md:grid-cols-2 gap-12 items-center">
             <AnimatedSection className="relative z-10 text-center md:text-left">
                <h1 className="text-4xl md:text-6xl font-extrabold text-hin-blue-900 leading-tight text-gradient">
                    Khai phá Tiềm năng Tiếng Anh của bạn
                </h1>
                <p className="mt-6 text-lg text-gray-600 max-w-xl mx-auto md:mx-0">
                    Một nền tảng liền mạch để học viên, giáo viên và quản trị viên hợp tác và đạt đến sự xuất sắc.
                </p>
                <div className="mt-10">
                    <Button onClick={onLoginClick} size="lg" variant="primary" className="transform hover:scale-105 transition-transform duration-300 shadow-lg shadow-hin-orange/30">
                        Bắt đầu ngay
                    </Button>
                </div>
            </AnimatedSection>
            <AnimatedSection>
                <div className="w-full h-80 bg-gray-200 rounded-2xl shadow-2xl overflow-hidden shimmer-wrapper">
                    {heroImage ? <img src={heroImage} alt="Teacher and student learning" className="w-full h-full object-cover" /> : <div className="w-full h-full"></div>}
                </div>
            </AnimatedSection>
        </div>
      </main>
      
      <AnimatedSection className="py-16">
            <div className="container mx-auto px-6">
                <p className="text-center text-sm font-semibold text-gray-500 uppercase tracking-wider mb-8">Được tin dùng bởi các trung tâm hàng đầu</p>
                <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                    <img src={logoInnovate} alt="Innovate EDU logo" className="h-8" />
                    <img src={logoQuantum} alt="QuantumLeap logo" className="h-8" />
                    <img src={logoApex} alt="Apex Academy logo" className="h-8" />
                    <img src={logoZenith} alt="Zenith Institute logo" className="h-8" />
                </div>
                 <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                    <div>
                        <span ref={studentsRef} className="text-4xl font-bold text-hin-orange">{studentsCount}+</span>
                        <p className="text-gray-600 mt-1">Học viên đã đăng ký</p>
                    </div>
                     <div>
                        <span ref={teachersRef} className="text-4xl font-bold text-hin-green">{teachersCount}+</span>
                        <p className="text-gray-600 mt-1">Giáo viên tích cực</p>
                    </div>
                     <div>
                        <span ref={classesRef} className="text-4xl font-bold text-hin-blue-700">{classesCount}+</span>
                        <p className="text-gray-600 mt-1">Lớp học được quản lý</p>
                    </div>
                </div>
            </div>
      </AnimatedSection>
      
      {/* Interactive Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-6">
            <AnimatedSection className="text-center mb-12">
                 <h2 className="text-3xl md:text-4xl font-bold text-hin-blue-900">Một nền tảng, Mọi vai trò</h2>
                 <p className="text-gray-600 mt-4 max-w-2xl mx-auto">Các công cụ được tùy chỉnh để đáp ứng nhu cầu riêng của từng người dùng trong hệ sinh thái giáo dục của bạn.</p>
            </AnimatedSection>

            <AnimatedSection>
                <div className="flex justify-center mb-8 border border-gray-200 rounded-lg p-1 bg-white/50 backdrop-blur-sm max-w-md mx-auto">
                    {(Object.keys(featureContent) as Array<UserRole>).map(role => (
                        <button 
                            key={role}
                            onClick={() => setActiveFeatureTab(role)}
                            className={`w-1/3 py-2.5 text-sm font-semibold rounded-md transition-colors duration-300 relative ${activeFeatureTab === role ? 'text-white' : 'text-hin-blue-800 hover:bg-gray-100'}`}
                        >
                           {activeFeatureTab === role && <div className="absolute inset-0 bg-hin-blue-700 rounded-md -z-10" />}
                           {role.charAt(0).toUpperCase() + role.slice(1)}
                        </button>
                    ))}
                </div>

                <div className="grid md:grid-cols-2 gap-8 items-center mt-12">
                    <div className="order-2 md:order-1">
                        <h3 className="text-2xl font-bold text-hin-blue-900 mb-4">{activeFeature.title}</h3>
                        <p className="text-gray-600 mb-6">{activeFeature.description}</p>
                        <ul className="space-y-3">
                            {activeFeature.features.map(feat => (
                                <li key={feat} className="flex items-center">
                                    <svg className="w-5 h-5 text-hin-green mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                    <span className="text-gray-700">{feat}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                     <div className="order-1 md:order-2">
                         <img src={activeFeature.image} alt={`${activeFeature.title} UI`} className="rounded-lg shadow-2xl w-full" />
                     </div>
                </div>
            </AnimatedSection>
        </div>
      </section>

      {/* Video Demo Section */}
        <section className="py-20">
            <AnimatedSection className="container mx-auto px-6 text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-hin-blue-900 mb-4">Xem Hin hoạt động</h2>
                <p className="text-gray-600 mt-4 max-w-2xl mx-auto mb-8">Khám phá cách nền tảng của chúng tôi có thể thay đổi trung tâm của bạn chỉ trong 2 phút.</p>
                <div className="max-w-3xl mx-auto aspect-video bg-hin-blue-900 rounded-lg shadow-2xl flex items-center justify-center text-white">
                    <p>(Khu vực dành cho Video Demo)</p>
                </div>
            </AnimatedSection>
        </section>


      <section id="testimonials" className="py-20 bg-white/50">
        <div className="container mx-auto px-6">
             <AnimatedSection className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-hin-blue-900">Cộng đồng của chúng tôi nói gì</h2>
            </AnimatedSection>
            <div className="relative max-w-xl mx-auto">
                 <div className="overflow-hidden">
                    <div className="flex transition-transform duration-500 ease-in-out" style={{ transform: `translateX(-${currentTestimonial * 100}%)` }}>
                         {testimonials.map((t, index) => (
                            <div key={index} className="w-full flex-shrink-0 p-2">
                                 <TestimonialCard quote={t.quote} name={t.name} role={t.role} />
                            </div>
                        ))}
                    </div>
                </div>
                 <button aria-label="Previous testimonial" onClick={() => setCurrentTestimonial(prev => (prev - 1 + testimonials.length) % testimonials.length)} className="absolute top-1/2 -left-4 md:-left-12 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-colors z-10">
                    <svg className="w-6 h-6 text-hin-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button aria-label="Next testimonial" onClick={() => setCurrentTestimonial(prev => (prev + 1) % testimonials.length)} className="absolute top-1/2 -right-4 md:-right-12 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-colors z-10">
                    <svg className="w-6 h-6 text-hin-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
            </div>
             <div className="flex justify-center mt-8 space-x-2">
                {testimonials.map((_, index) => (
                    <button key={index} aria-label={`Go to testimonial ${index + 1}`} onClick={() => setCurrentTestimonial(index)} className={`w-3 h-3 rounded-full ${currentTestimonial === index ? 'bg-hin-orange' : 'bg-hin-blue-200'} transition-colors`}></button>
                ))}
            </div>
        </div>
      </section>
      
      {/* Integrations & As Seen On */}
      <section className="py-20">
        <AnimatedSection className="container mx-auto px-6 space-y-12">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-hin-blue-900 mb-4">Tích hợp Liền mạch</h3>
            <p className="text-gray-600 mb-8 max-w-xl mx-auto">Kết nối Hin với các công cụ bạn đã yêu thích để có một quy trình làm việc thống nhất.</p>
            <div className="flex justify-center items-center gap-x-10 gap-y-6 grayscale opacity-75">
              <img src={logoGoogleClassroom} alt="Google Classroom" className="h-9"/>
              <img src={logoZoom} alt="Zoom" className="h-9"/>
              <img src={logoSlack} alt="Slack" className="h-9"/>
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-2xl font-bold text-hin-blue-900 mb-4">Được nhắc đến trên</h3>
            <div className="flex justify-center items-center gap-x-10 gap-y-6 grayscale opacity-75">
               <img src={logoEdtechWeekly} alt="EdTech Weekly" className="h-10"/>
               <img src={logoLearnMagazine} alt="Learn Magazine" className="h-10"/>
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-white/50">
          <AnimatedSection className="container mx-auto px-6 max-w-3xl">
               <h2 className="text-3xl md:text-4xl font-bold text-hin-blue-900 text-center mb-12">Câu hỏi Thường gặp</h2>
               <div className="space-y-4">
                  <details className="accordion-item bg-white p-6 rounded-lg border border-gray-200/80 shadow-sm group">
                      <summary className="flex justify-between items-center font-semibold cursor-pointer">
                          Nền tảng này có phù hợp với trung tâm nhỏ không?
                          <span className="icon text-hin-orange text-2xl font-thin">+</span>
                      </summary>
                      <p className="text-gray-600 mt-4">Chắc chắn rồi! Hin được thiết kế để có thể mở rộng, phù hợp cho cả các trung tâm nhỏ và các tổ chức giáo dục lớn.</p>
                  </details>
                   <details className="accordion-item bg-white p-6 rounded-lg border border-gray-200/80 shadow-sm group">
                      <summary className="flex justify-between items-center font-semibold cursor-pointer">
                          Dữ liệu của chúng tôi có được bảo mật không?
                          <span className="icon text-hin-orange text-2xl font-thin">+</span>
                      </summary>
                      <p className="text-gray-600 mt-4">Bảo mật là ưu tiên hàng đầu của chúng tôi. Chúng tôi sử dụng các tiêu chuẩn mã hóa và bảo mật hàng đầu ngành để bảo vệ dữ liệu của bạn.</p>
                  </details>
               </div>
          </AnimatedSection>
      </section>

      <section id="pricing" className="py-20">
        <AnimatedSection className="container mx-auto px-6 max-w-4xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-hin-blue-900">Gói giá linh hoạt</h2>
            <p className="text-gray-600 mt-4 mb-8">Chọn gói phù hợp nhất với nhu cầu của trung tâm bạn.</p>
            <div className="flex justify-center items-center space-x-4 mb-12">
                <span className={`font-medium ${!isYearly ? 'text-hin-blue-900' : 'text-gray-500'}`}>Hàng tháng</span>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={isYearly} onChange={() => setIsYearly(!isYearly)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-hin-blue-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-hin-orange peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-hin-orange"></div>
                </label>
                <span className={`font-medium ${isYearly ? 'text-hin-blue-900' : 'text-gray-500'}`}>Hàng năm</span>
                <span className="bg-hin-green-100 text-hin-green-800 text-xs font-bold px-2 py-1 rounded-full">-20%</span>
            </div>
            <div className="grid md:grid-cols-3 gap-8 text-left">
                <div className="p-8 border rounded-lg glass-card shadow-lg">
                    <h3 className="text-xl font-bold text-hin-blue-900">Cơ bản</h3>
                    <p className="text-4xl font-extrabold my-4">Miễn phí</p>
                    <ul className="space-y-2 text-gray-600">
                        <li>✓ Lên đến 20 học viên</li>
                        <li>✓ 1 giáo viên</li>
                        <li>✓ Tính năng cơ bản</li>
                    </ul>
                </div>
                <div className="p-8 border-2 border-hin-orange rounded-lg bg-white shadow-2xl relative transform scale-105">
                    <span className="absolute top-0 -translate-y-1/2 bg-hin-orange text-white px-3 py-1 text-sm font-bold rounded-full">Phổ biến</span>
                    <h3 className="text-xl font-bold text-hin-blue-900">Chuyên nghiệp</h3>
                    <p className="text-4xl font-extrabold my-4">${isYearly ? (49 * 12 * 0.8).toFixed(0) : 49}<span className="text-base font-medium text-gray-500">/{isYearly ? 'năm' : 'tháng'}</span></p>
                    <ul className="space-y-2 text-gray-600">
                        <li>✓ Lên đến 100 học viên</li>
                        <li>✓ 5 giáo viên</li>
                        <li>✓ Báo cáo nâng cao</li>
                        <li>✓ Hỗ trợ qua email</li>
                    </ul>
                </div>
                <div className="p-8 border rounded-lg glass-card shadow-lg">
                    <h3 className="text-xl font-bold text-hin-blue-900">Doanh nghiệp</h3>
                    <p className="text-4xl font-extrabold my-4">Liên hệ</p>
                    <ul className="space-y-2 text-gray-600">
                        <li>✓ Không giới hạn học viên</li>
                        <li>✓ Hỗ trợ ưu tiên</li>
                        <li>✓ Tùy chỉnh thương hiệu</li>
                    </ul>
                </div>
            </div>
        </AnimatedSection>
      </section>
      
      <section id="cta" className="bg-hin-blue-900 text-white">
        <AnimatedSection className="container mx-auto px-6 py-20 text-center">
             <h2 className="text-3xl md:text-4xl font-bold">Sẵn sàng để nâng cao trải nghiệm học tập của bạn?</h2>
             <p className="mt-4 mb-8 text-hin-blue-200 max-w-xl mx-auto">Tham gia cùng hàng trăm nhà giáo dục và học viên đã tin tưởng Hin.</p>
             <Button onClick={onLoginClick} size="lg" variant="primary" className="transform hover:scale-105 transition-transform duration-300 shadow-lg shadow-hin-orange/40">
                Bắt đầu miễn phí
            </Button>
        </AnimatedSection>
      </section>

      <footer className="bg-hin-beige-100 py-12 border-t border-gray-200">
        <div className="container mx-auto px-6 text-center text-gray-500">
            <div className="mb-8">
              <p className="font-semibold mb-2 text-hin-blue-800">Đăng ký nhận tin tức</p>
              <form className="flex justify-center max-w-sm mx-auto">
                <input type="email" placeholder="Nhập email của bạn" className="w-full px-4 py-2 border border-gray-300 rounded-l-md focus:ring-hin-orange focus:border-hin-orange"/>
                <Button type="submit" variant="secondary" className="rounded-l-none">Đăng ký</Button>
              </form>
            </div>
            <p>&copy; {new Date().getFullYear()} Hin Language Center. Mọi quyền được bảo lưu.</p>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;