'use client';

import React, { useState } from 'react';

interface Scenario {
  id: string;
  name: string;
  variables: Record<string, number>;
  outcomes: Record<string, string>;
}

export function DecisionSimulator() {
  const [scenarios] = useState<Scenario[]>([
    {
      id: '1',
      name: 'Price Increase Impact',
      variables: { priceChange: 15, churnImpact: 5 },
      outcomes: { revenue: '+$320K', customers: '-2%', margin: '+8%' },
    },
    {
      id: '2',
      name: 'Marketing Budget Reallocation',
      variables: { digitalSpend: 40, traditionalSpend: -30 },
      outcomes: { leads: '+18%', cac: '-12%', roi: '+22%' },
    },
  ]);

  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Decision Simulator</h1>
        <p className="text-gray-600">Model "what-if" scenarios and predict outcomes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Saved Scenarios</h2>
          {scenarios.map((scenario) => (
            <button
              key={scenario.id}
              onClick={() => setSelectedScenario(scenario.id)}
              className={`w-full text-left p-4 rounded-lg border transition-colors ${
                selectedScenario === scenario.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <h3 className="font-medium text-gray-900">{scenario.name}</h3>
              <p className="text-sm text-gray-600 mt-1">
                {Object.keys(scenario.variables).length} variables
              </p>
            </button>
          ))}

          <button className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors">
            + Create New Scenario
          </button>
        </div>

        <div className="lg:col-span-2">
          {selectedScenario ? (
            <div className="bg-white rounded-lg shadow p-6 space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {scenarios.find(s => s.id === selectedScenario)?.name}
                </h2>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Input Variables</h3>
                <div className="space-y-4">
                  {selectedScenario && (
                    <>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          Price Change (%)
                        </label>
                        <input
                          type="range"
                          min="-50"
                          max="100"
                          defaultValue={15}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>-50%</span>
                          <span>+15%</span>
                          <span>+100%</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          Expected Churn Impact (%)
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="20"
                          defaultValue={5}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>0%</span>
                          <span>5%</span>
                          <span>20%</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Predicted Outcomes</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">Revenue Impact</p>
                    <p className="text-xl font-semibold text-green-700">+$320K</p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg">
                    <p className="text-sm text-gray-600">Customer Change</p>
                    <p className="text-xl font-semibold text-red-700">-2%</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Margin Improvement</p>
                    <p className="text-xl font-semibold text-blue-700">+8%</p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  Run Simulation
                </button>
                <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                  Save Scenario
                </button>
                <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                  Export Results
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-12 text-center">
              <p className="text-gray-500">Select a scenario to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
