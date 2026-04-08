import { Decision } from '@/types';

interface DecisionCardProps {
  decision: Decision;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}

export function DecisionCard({ decision, onAccept, onReject }: DecisionCardProps) {
  const priorityColors = {
    high: 'bg-red-100 border-red-500 text-red-800',
    medium: 'bg-yellow-100 border-yellow-500 text-yellow-800',
    low: 'bg-green-100 border-green-500 text-green-800',
  };

  return (
    <div className={`border-l-4 p-4 mb-4 bg-white rounded shadow ${priorityColors[decision.priority]}`}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-lg">{decision.title}</h3>
          <p className="text-gray-600 mt-1">{decision.description}</p>
          
          {decision.tradeOffs && decision.tradeOffs.length > 0 && (
            <div className="mt-3">
              <h4 className="font-medium text-sm">Trade-offs:</h4>
              {decision.tradeOffs.map((tradeOff, idx) => (
                <div key={idx} className="mt-2 ml-2 text-sm">
                  <p className="font-medium">{tradeOff.option}</p>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <ul className="text-green-700">
                      {tradeOff.pros.map((pro, i) => (
                        <li key={i}>✓ {pro}</li>
                      ))}
                    </ul>
                    <ul className="text-red-700">
                      {tradeOff.cons.map((con, i) => (
                        <li key={i}>✗ {con}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-3 flex items-center gap-4 text-sm">
            <span>Confidence: {(decision.confidence * 100).toFixed(0)}%</span>
            <span>Created: {new Date(decision.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {decision.status === 'pending' && (
          <div className="flex gap-2">
            <button
              onClick={() => onAccept(decision.id)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Accept
            </button>
            <button
              onClick={() => onReject(decision.id)}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
