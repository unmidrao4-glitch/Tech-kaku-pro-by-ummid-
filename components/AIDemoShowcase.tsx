
import React, { useState } from 'react';
import { DemoTab } from '../types';
import { AssistantDemo } from './demos/AssistantDemo';
import { CreativeSuiteDemo } from './demos/CreativeSuiteDemo';
import { LiveConversationDemo } from './demos/LiveConversationDemo';

const tabs = [
    { id: DemoTab.ASSISTANT, label: 'Kaku Assistant', icon: '💬' },
    { id: DemoTab.CREATIVE, label: 'Creative Suite', icon: '🎨' },
    { id: DemoTab.LIVE, label: 'Live Conversation', icon: '🎙️' },
];

export const AIDemoShowcase: React.FC = () => {
    const [activeTab, setActiveTab] = useState<DemoTab>(DemoTab.ASSISTANT);

    const renderContent = () => {
        switch (activeTab) {
            case DemoTab.ASSISTANT:
                return <AssistantDemo />;
            case DemoTab.CREATIVE:
                return <CreativeSuiteDemo />;
            case DemoTab.LIVE:
                return <LiveConversationDemo />;
            default:
                return null;
        }
    };

    return (
        <section id="demos" className="py-20 md:py-28 bg-black/20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Explore Our AI Capabilities</h2>
                    <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-400">
                        Experience the power of Gemini integrated into our platform.
                    </p>
                </div>

                <div className="max-w-5xl mx-auto">
                    <div className="mb-8 flex justify-center border-b border-gray-700">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-3 font-semibold text-sm sm:text-base transition-colors duration-200 focus:outline-none ${activeTab === tab.id
                                    ? 'border-b-2 border-indigo-500 text-white'
                                    : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                <span className="hidden sm:inline">{tab.icon}</span>
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                    <div className="bg-gray-800/50 rounded-2xl border border-gray-700 min-h-[600px] p-4 sm:p-8">
                        {renderContent()}
                    </div>
                </div>
            </div>
        </section>
    );
};
