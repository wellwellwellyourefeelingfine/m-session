/**
 * ResourcesTool Component
 * Crisis resources, hotlines, safety information
 */

export default function ResourcesTool() {
  return (
    <div className="py-12 px-6 max-w-xl mx-auto">
      <h3 className="text-lg mb-6 uppercase tracking-wider text-xs text-app-gray-600">
        Crisis Resources
      </h3>

      <div className="space-y-6">
        {/* Orientation Reminder */}
        <div>
          <p className="text-lg leading-relaxed mb-4">
            You're safe. You took MDMA. This will pass. Everything you're experiencing is temporary.
          </p>
        </div>

        {/* Crisis Lines */}
        <div className="border-t border-app-gray-200 dark:border-app-gray-800 pt-6">
          <div className="space-y-3 text-lg">
            <div>
              <p className="text-app-gray-600 dark:text-app-gray-400 text-sm mb-1">Fireside Project</p>
              <a href="tel:+16232473473" className="underline">+1 (623) 247-3473</a>
            </div>
            <div>
              <p className="text-app-gray-600 dark:text-app-gray-400 text-sm mb-1">Crisis Text Line</p>
              <p>Text <span className="font-medium">HOME</span> to <span className="font-medium">741741</span></p>
            </div>
            <div>
              <p className="text-app-gray-600 dark:text-app-gray-400 text-sm mb-1">988 Suicide & Crisis Lifeline</p>
              <a href="tel:988" className="underline">988</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
