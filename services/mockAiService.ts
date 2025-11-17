
import { Model } from '../types';

const mockResponses: Record<Model, string[]> = {
  [Model.Grok]: [
    "That's an interesting point. Building on that, we should consider the implications for scalability.",
    "I agree. My analysis suggests a phased approach would be most effective.",
    "Let's not forget the user experience aspect. How will this impact the end-user?",
    "A radical idea, but it might just work. We need more data to be sure.",
    "I have a slightly different perspective. What if we approached it from a security-first standpoint?"
  ],
  [Model.OpenAI]: [
    "Based on the provided context, the logical next step is to outline a clear project plan.",
    "Let's summarize the key takeaways so far. One, we need a solution. Two, it must be efficient. Three, it must be secure.",
    "Considering the previous arguments, I propose we create a proof-of-concept to test this hypothesis.",
    "It seems we have a consensus on the core problem. The solution, however, is still up for debate.",
    "From a data analysis perspective, we should prioritize the features that offer the most value to the user."
  ],
  [Model.DeepSeek]: [
    "Digging deeper into the technical details, the choice of database will be critical for performance.",
    "My deep analysis of the problem suggests an underlying issue we haven't addressed yet.",
    "Let's explore the long-term maintenance costs associated with this solution.",
    "I've cross-referenced this with several case studies. The success rate is promising if we follow best practices.",
    "I recommend a thorough code review before proceeding. We need to ensure quality from the start."
  ],
  [Model.ZAI]: [
    "Thinking outside the box, what if we leveraged machine learning to predict user behavior?",
    "A creative solution is needed here. Let's brainstorm some unconventional ideas.",
    "This problem requires a futuristic outlook. How will this solution hold up in five years?",
    "Let's pivot slightly. The real opportunity lies in the data we can collect.",
    "My predictive models indicate a high probability of success with this strategy. Let's move forward."
  ],
  [Model.Gemini]: [], // Not used here, but added for type consistency
  [Model.User]: [], // Not used here
};

export const generateMockResponse = (
  model: Model,
  masterPrompt: string,
  conversation: string
): Promise<string> => {
  return new Promise(resolve => {
    const delay = Math.random() * 1500 + 500; // Simulate network latency
    setTimeout(() => {
      const responses = mockResponses[model];
      const randomIndex = Math.floor(Math.random() * responses.length);
      resolve(responses[randomIndex]);
    }, delay);
  });
};
