import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { User, Badge } from '../../types';
import Spinner from '../../components/ui/Spinner';
import Card, { CardContent } from '../../components/ui/Card';

interface StudentAchievementsProps {
  currentUser: User;
}

const StudentAchievements: React.FC<StudentAchievementsProps> = ({ currentUser }) => {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const fetchedBadges = await api.getStudentAchievements(currentUser.id);
        setBadges(fetchedBadges);
      } catch (error) {
        console.error("Failed to fetch achievements", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBadges();
  }, [currentUser.id]);

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Spinner /></div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-hin-blue-900 mb-6">Thành tích của tôi</h1>
      {badges.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {badges.map((badge) => (
            <Card key={badge.id} className="text-center hover-lift-glow">
              <CardContent>
                <div className="text-5xl mb-4">{badge.icon}</div>
                <h3 className="text-xl font-bold text-hin-blue-800">{badge.name}</h3>
                <p className="text-gray-600 mt-2">{badge.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 bg-white p-6 rounded-lg border">Bạn chưa có thành tích nào. Hãy tiếp tục cố gắng!</p>
      )}
    </div>
  );
};

export default StudentAchievements;
