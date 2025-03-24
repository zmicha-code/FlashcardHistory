import React, { useEffect } from "react";
import {
  RemHierarchyEditorTree,
  RemId,
  RemViewer,
  renderWidget,
  usePlugin,
  useSyncedStorageState,
  QueueInteractionScore,
  RemRichTextEditor,
  Rem
} from "@remnote/plugin-sdk";
import MyRemNoteButton from '../components/MyRemNoteButton';
import { ScoreFilterButton, scoreToLabel } from '../components/ScoreFilterButton';
import { HistoryData } from "../types/HistoryData";
import { timeSince } from '../utils/TimeAndDate';

const NUM_TO_LOAD_IN_BATCH = 20;

function cardHistorySidebar() {
  // Remove from History
  const removeFlashcard = (id: string) => { 
    //const newData = [...remData]; // Create a copy
    //newData.splice(index, 1);
    //setRemData(newData);
    const index = remData.findIndex(d => d.remId === id);
    if (index !== -1) {
      const newData = [...remData];
      newData.splice(index, 1);
      setRemData(newData);
    }
  };

  // Partial is a TypeScript utility type, not a class. It makes all properties of HistoryData optional. So, changes can include just some properties of HistoryData (e.g., { open: true }) without needing to provide everything.
  // Creates a new object by merging oldData with changes using the spread operator. For example, if changes = { open: true }, it updates open while keeping other properties intact.
  // Replaces the old object at index with newData
  const updateData = (id: string, changes: Partial<HistoryData>) => { 
    //const newDataArray = [...remData];
    //newDataArray[index] = { ...remData[index], ...changes };
    //setRemData(newDataArray);
    const index = remData.findIndex(d => d.remId === id);
    if (index !== -1) {
      const newDataArray = [...remData];
      newDataArray[index] = { ...remData[index], ...changes };
      setRemData(newDataArray);
    }
  };

  //
  function toggleScoreFilter(score: QueueInteractionScore) {
    if (selectedScore === score) {
      setSelectedScore(null); // Deselect if already selected
    } else {
      setSelectedScore(score); // Select the clicked score
    }
  };

  // -------------------------------------------------------------------------------

  //
  const [remData, setRemData] = useSyncedStorageState<HistoryData[]>(
    "cardData",
    []
  );

  // State: flashcards
  const [numLoaded, setNumLoaded] = React.useState(1);

  // State: filter
  const [selectedScore, setSelectedScore] = React.useState<QueueInteractionScore | null>(null);

  // State: search
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<RemId[] | null>(null);

  // Hook:  remData.length
  useEffect(() => {
    setNumLoaded(1);
  }, [remData.length, selectedScore, searchQuery]);

  // Hook: searchQuerey

  //
  //const filteredData = selectedScore != null ? remData.filter(data => data.score === selectedScore) : remData;
  const filteredData = remData.filter(data =>
    (selectedScore == null || data.score === selectedScore) &&
    (searchQuery === "" || (data.question && data.question.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  //
  const numUnloaded = Math.max(0, filteredData.length - NUM_TO_LOAD_IN_BATCH * numLoaded);

  // Rendering Logic
  return (
    <div
      className="h-full w-full overflow-y-auto rn-clr-background-primary hover:bg-gray-400"
      //This stops the mouseDown event from “bubbling up” to parent elements. For example, clicking in the sidebar won’t trigger actions in the main app, keeping interactions isolated.
      onMouseDown={(e) => e.stopPropagation()} // What does this do?
    >
      {/* Toolbar Top */}
      <div className="p-2 flex justify-between">
      {/* Filter Buttons*/}
      <div className="flex gap-2">
        {Object.values(QueueInteractionScore).filter(value => typeof value === 'number').map((score) => { // Only get numeric values
          const scoreValue = score as QueueInteractionScore; // Cast to enum type
          const amount = remData.filter(data => data.score === scoreValue).length; // Calculate amount
          return (
            <ScoreFilterButton
              key={scoreValue}
              score={scoreValue}
              image={scoreToImage.get(scoreValue)!}
              isSelected={selectedScore === scoreValue}
              onToggle={() => toggleScoreFilter(scoreValue)}
              amount={amount}
            />
        );
      })}
      </div>
      <MyRemNoteButton
        img="M3.32104 8.64925C3.32104 9.29895 3.44155 9.90847 3.68257 10.4778C3.92708 11.0437 4.2624 11.5414 4.68854 11.9711C5.11469 12.4007 5.61069 12.7343 6.17655 12.9718C6.74591 13.2128 7.35543 13.3333 8.00513 13.3333C8.65133 13.3333 9.25736 13.2128 9.82322 12.9718C10.3891 12.7343 10.8868 12.4007 11.3165 11.9711C11.7461 11.5414 12.0797 11.0437 12.3172 10.4778C12.5582 9.90847 12.6787 9.29895 12.6787 8.64925C12.6787 8.49207 12.6298 8.36458 12.532 8.26677C12.4377 8.16897 12.312 8.12007 12.1548 8.12007C12.0046 8.12007 11.8823 8.16897 11.788 8.26677C11.6972 8.36458 11.6518 8.49207 11.6518 8.64925C11.6518 9.15573 11.5575 9.63078 11.3689 10.0744C11.1802 10.5145 10.9183 10.904 10.5829 11.2428C10.2511 11.5781 9.86339 11.8401 9.41978 12.0287C8.97967 12.2138 8.50811 12.3064 8.00513 12.3064C7.49515 12.3064 7.02011 12.2138 6.57999 12.0287C6.13988 11.8401 5.75216 11.5781 5.41683 11.2428C5.085 10.904 4.82477 10.5145 4.63615 10.0744C4.44753 9.63078 4.35322 9.15573 4.35322 8.64925C4.35322 8.13928 4.44578 7.66249 4.63091 7.21888C4.81953 6.77527 5.07976 6.38755 5.41159 6.05572C5.74342 5.72039 6.12765 5.45842 6.56427 5.2698C7.00439 5.08118 7.47943 4.98687 7.98941 4.98687C8.16056 4.98687 8.32473 4.9956 8.48192 5.01307C8.6391 5.02704 8.78406 5.04799 8.91679 5.07594L7.49166 6.48535C7.44625 6.53426 7.40957 6.5884 7.38163 6.64778C7.35718 6.70367 7.34495 6.76479 7.34495 6.83116C7.34495 6.97437 7.39385 7.09488 7.49166 7.19268C7.58946 7.29049 7.70822 7.33939 7.84794 7.33939C7.99814 7.33939 8.11865 7.29223 8.20946 7.19792L10.3576 5.02878C10.4135 4.9729 10.4537 4.91352 10.4782 4.85064C10.5061 4.78777 10.5201 4.7214 10.5201 4.65154C10.5201 4.50484 10.4659 4.37909 10.3576 4.2743L8.20946 2.0842C8.11515 1.9864 7.99465 1.9375 7.84794 1.9375C7.70473 1.9375 7.58422 1.98815 7.48642 2.08944C7.39211 2.18725 7.34495 2.3095 7.34495 2.45621C7.34495 2.52257 7.35718 2.58545 7.38163 2.64483C7.40608 2.70072 7.44101 2.75311 7.48642 2.80201L8.75437 4.05424C8.63561 4.02979 8.51161 4.01058 8.38237 3.99661C8.25662 3.98264 8.12563 3.97565 7.98941 3.97565C7.33971 3.97565 6.73194 4.09791 6.16607 4.34241C5.6037 4.58343 5.10945 4.91701 4.68331 5.34315C4.25716 5.76929 3.92358 6.2653 3.68257 6.83116C3.44155 7.39702 3.32104 8.00305 3.32104 8.64925Z"
        text="Reset Flashcards"
        onClick={() => setRemData([])}
      />
      </div>
      {/* Notification (no flashcards) */}
      {filteredData.length == 0 && (
        <div className="rn-clr-content-primary">
          {selectedScore != null ? `No flashcards with score ${scoreToLabel[selectedScore]}.` : "No flashcards in history."}
        </div>
      )}
      {/* List of flashcards */}
      {/*Slice a fraction of the history to be displayed. map((data, i) => ...) loops over those items, rendering a <RemHistoryItem> for each one. data is the item, i is its index in the sliced array.*/}
      {filteredData.slice(0, NUM_TO_LOAD_IN_BATCH * numLoaded).map((data, i) => (
        <RemHistoryItem
          data={data}
          remId={data.remId}
          key={data.key || Math.random()}
          setData={(c) => updateData(data.remId, c)}
          closeIndex={() => removeFlashcard(data.remId)}
        />
      ))}
      {/* Toolbar Bottom*/}
      <div className="p-2 flex justify-end">
        {/* 
        {numUnloaded > 0 &&
        <MyRemNoteButton
        img="M8.23394 6.71531C8.20634 6.6979 8.16515 6.6979 8.08278 6.6979H6.48406C6.02881 6.69789 5.63942 6.69788 5.31959 6.72445C4.98295 6.75241 4.6532 6.81383 4.33817 6.97748C3.88466 7.21306 3.51489 7.58284 3.27931 8.03635C3.11567 8.35138 3.05425 8.68113 3.02629 9.01777C2.99973 9.3376 2.99974 9.72698 2.99976 10.1822L2.99976 17.4753C2.99975 17.9271 2.99974 18.3137 3.02603 18.6314C3.05372 18.9659 3.11454 19.2936 3.2764 19.6072C3.50954 20.0588 3.87568 20.428 4.32535 20.6649C4.63753 20.8294 4.96468 20.893 5.29898 20.9235C5.61647 20.9525 6.00299 20.9557 6.45474 20.9595L11.8816 21.005C12.8324 21.013 13.7044 20.4606 14.08 19.5188C14.1029 19.4614 14.1144 19.4327 14.1105 19.4034C14.1073 19.3799 14.0951 19.3552 14.0783 19.3384C14.0574 19.3176 14.0256 19.3087 13.9621 19.291L12.7767 18.9604C12.7191 18.9443 12.6903 18.9363 12.668 18.939C12.6457 18.9418 12.6339 18.9464 12.6157 18.9595C12.5974 18.9726 12.5773 19.0052 12.5372 19.0702C12.4021 19.2892 12.1603 19.4272 11.8949 19.425L6.49928 19.3797C6.00766 19.3755 5.68709 19.3722 5.44252 19.3499C5.20746 19.3285 5.11352 19.2942 5.06191 19.267C4.8984 19.1808 4.76526 19.0466 4.68048 18.8824C4.65372 18.8305 4.62024 18.7363 4.60077 18.5011C4.58051 18.2563 4.57988 17.9357 4.57988 17.4441L4.57988 10.2137C4.57988 9.71834 4.58051 9.39516 4.60099 9.14854C4.62069 8.91138 4.65457 8.81663 4.68153 8.76473C4.7672 8.59982 4.90166 8.46536 5.06657 8.37969C5.11847 8.35273 5.21321 8.31884 5.45038 8.29915C5.69699 8.27866 6.02018 8.27803 6.5155 8.27802H7.73991C7.78973 8.27802 7.81464 8.27802 7.8355 8.26932C7.85314 8.26195 7.86863 8.25023 7.8805 8.23524C7.89454 8.21752 7.90129 8.19355 7.91481 8.1456L8.25768 6.9289C8.28002 6.84962 8.2912 6.80997 8.28192 6.77869C8.27414 6.75244 8.25709 6.72992 8.23394 6.71531Z"
        text={`Load more (${numUnloaded})`}
        onClick={() => setNumLoaded((i) => i + 1)}
        />
        }
        */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)}}
          placeholder="Search flashcards..."
          className="flex-grow mr-2 p-1 border rounded"
        />
        <MyRemNoteButton
            img="M8.41406 20.8164H15.5938C16.1927 20.8164 16.6745 20.6445 17.0391 20.3008C17.4036 19.9622 17.599 19.4909 17.625 18.8867L18.1562 7.63672H19.0156C19.2083 7.63672 19.3698 7.56901 19.5 7.43359C19.6354 7.29818 19.7031 7.13411 19.7031 6.94141C19.7031 6.7487 19.6354 6.58724 19.5 6.45703C19.3698 6.32682 19.2083 6.26172 19.0156 6.26172H4.99219C4.79948 6.26172 4.63542 6.32943 4.5 6.46484C4.36458 6.59505 4.29688 6.75391 4.29688 6.94141C4.29688 7.13411 4.36458 7.29818 4.5 7.43359C4.63542 7.56901 4.79948 7.63672 4.99219 7.63672H5.85156L6.38281 18.8945C6.40885 19.4987 6.60156 19.9701 6.96094 20.3086C7.32552 20.6471 7.8099 20.8164 8.41406 20.8164ZM8.57031 19.4336C8.35156 19.4336 8.17188 19.3607 8.03125 19.2148C7.89062 19.069 7.8151 18.8815 7.80469 18.6523L7.27344 7.63672H16.7031L16.1953 18.6523C16.1849 18.8867 16.1094 19.0742 15.9688 19.2148C15.8281 19.3607 15.6484 19.4336 15.4297 19.4336H8.57031ZM9.70312 18.168C9.86458 18.168 9.99219 18.1211 10.0859 18.0273C10.1849 17.9336 10.2344 17.8086 10.2344 17.6523L9.99219 9.46484C9.99219 9.3138 9.94271 9.19141 9.84375 9.09766C9.74479 9.00391 9.61458 8.95703 9.45312 8.95703C9.29167 8.95703 9.16146 9.00651 9.0625 9.10547C8.96354 9.19922 8.91667 9.32161 8.92188 9.47266L9.15625 17.6602C9.16146 17.8164 9.21354 17.9414 9.3125 18.0352C9.41146 18.1237 9.54167 18.168 9.70312 18.168ZM12 18.168C12.1667 18.168 12.2995 18.1211 12.3984 18.0273C12.5026 17.9336 12.5547 17.8112 12.5547 17.6602V9.47266C12.5547 9.32161 12.5026 9.19922 12.3984 9.10547C12.2995 9.00651 12.1667 8.95703 12 8.95703C11.8385 8.95703 11.7057 9.00651 11.6016 9.10547C11.5026 9.19922 11.4531 9.32161 11.4531 9.47266V17.6602C11.4531 17.8112 11.5026 17.9336 11.6016 18.0273C11.7057 18.1211 11.8385 18.168 12 18.168ZM14.3047 18.168C14.4609 18.168 14.5885 18.1237 14.6875 18.0352C14.7865 17.9414 14.8385 17.8164 14.8438 17.6602L15.0781 9.47266C15.0833 9.32161 15.0365 9.19922 14.9375 9.10547C14.8438 9.00651 14.7135 8.95703 14.5469 8.95703C14.3906 8.95703 14.263 9.00391 14.1641 9.09766C14.0651 9.19141 14.013 9.31641 14.0078 9.47266L13.7734 17.6523C13.7682 17.8086 13.8125 17.9336 13.9062 18.0273C14.0052 18.1211 14.138 18.168 14.3047 18.168ZM8.45312 6.77734H9.89844V5.16016C9.89844 4.96224 9.96354 4.80339 10.0938 4.68359C10.224 4.55859 10.3958 4.49609 10.6094 4.49609H13.375C13.5938 4.49609 13.7682 4.55859 13.8984 4.68359C14.0286 4.80339 14.0938 4.96224 14.0938 5.16016V6.77734H15.5391V5.08984C15.5391 4.49089 15.3568 4.02474 14.9922 3.69141C14.6276 3.35286 14.1224 3.18359 13.4766 3.18359H10.5078C9.86198 3.18359 9.35677 3.35286 8.99219 3.69141C8.63281 4.02474 8.45312 4.49089 8.45312 5.08984V6.77734Z"
            text=""
            onClick={() => setSearchQuery("")}
          />
      </div>
    </div>
  );
}
//
//
const scoreToImage = new Map<QueueInteractionScore, string>([
  [QueueInteractionScore.TOO_EARLY, "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzNiAzNiI+PHBhdGggZmlsbD0iI0ZGQ0M0RCIgZD0iTTIwIDYuMDQyYzAgMS4xMTItLjkwMyAyLjAxNC0yIDIuMDE0cy0yLS45MDItMi0yLjAxNFYyLjAxNEMxNiAuOTAxIDE2LjkwMyAwIDE4IDBzMiAuOTAxIDIgMi4wMTR2NC4wMjh6Ii8+PHBhdGggZmlsbD0iI0ZGQUMzMyIgZD0iTTkuMTggMzZjLS4yMjQgMC0uNDUyLS4wNTItLjY2Ni0uMTU5YTEuNTIxIDEuNTIxIDAgMCAxLS42NjctMi4wMjdsOC45NC0xOC4xMjdjLjI1Mi0uNTEyLjc2OC0uODM1IDEuMzMzLS44MzVzMS4wODEuMzIzIDEuMzMzLjgzNWw4Ljk0MSAxOC4xMjdhMS41MiAxLjUyIDAgMCAxLS42NjYgMi4wMjcgMS40ODIgMS40ODIgMCAwIDEtMS45OTktLjY3NkwxOC4xMjEgMTkuNzRsLTcuNjA3IDE1LjQyNUExLjQ5IDEuNDkgMCAwIDEgOS4xOCAzNnoiLz48cGF0aCBmaWxsPSIjNTg1OTVCIiBkPSJNMTguMTIxIDIwLjM5MmEuOTg1Ljk4NSAwIDAgMS0uNzAyLS4yOTVMMy41MTIgNS45OThjLS4zODgtLjM5NC0uMzg4LTEuMDMxIDAtMS40MjRzMS4wMTctLjM5MyAxLjQwNCAwTDE4LjEyMSAxNy45NiAzMS4zMjQgNC41NzNhLjk4NS45ODUgMCAwIDEgMS40MDUgMCAxLjAxNyAxLjAxNyAwIDAgMSAwIDEuNDI0bC0xMy45MDUgMTQuMWEuOTkyLjk5MiAwIDAgMS0uNzAzLjI5NXoiLz48cGF0aCBmaWxsPSIjREQyRTQ0IiBkPSJNMzQuMDE1IDE5LjM4NWMwIDguODk4LTcuMTE1IDE2LjExMS0xNS44OTQgMTYuMTExLTguNzc3IDAtMTUuODkzLTcuMjEzLTE1Ljg5My0xNi4xMTEgMC04LjkgNy4xMTYtMTYuMTEzIDE1Ljg5My0xNi4xMTMgOC43NzgtLjAwMSAxNS44OTQgNy4yMTMgMTUuODk0IDE2LjExM3oiLz48cGF0aCBmaWxsPSIjRTZFN0U4IiBkPSJNMzAuMDQxIDE5LjM4NWMwIDYuNjc0LTUuMzM1IDEyLjA4NC0xMS45MiAxMi4wODQtNi41ODMgMC0xMS45MTktNS40MS0xMS45MTktMTIuMDg0QzYuMjAyIDEyLjcxIDExLjUzOCA3LjMgMTguMTIxIDcuM2M2LjU4NS0uMDAxIDExLjkyIDUuNDEgMTEuOTIgMTIuMDg1eiIvPjxwYXRoIGZpbGw9IiNGRkNDNEQiIGQ9Ik0zMC4wNCAxLjI1N2E1Ljg5OSA1Ljg5OSAwIDAgMC00LjIxNCAxLjc3bDguNDI5IDguNTQ0QTYuMDY0IDYuMDY0IDAgMCAwIDM2IDcuMjk5YzAtMy4zMzYtMi42NjktNi4wNDItNS45Ni02LjA0MnptLTI0LjA4IDBhNS45IDUuOSAwIDAgMSA0LjIxNCAxLjc3bC04LjQyOSA4LjU0NEE2LjA2NCA2LjA2NCAwIDAgMSAwIDcuMjk5YzAtMy4zMzYgMi42NjgtNi4wNDIgNS45Ni02LjA0MnoiLz48cGF0aCBmaWxsPSIjNDE0MDQyIiBkPSJNMjMgMjBoLTVhMSAxIDAgMCAxLTEtMXYtOWExIDEgMCAwIDEgMiAwdjhoNGExIDEgMCAxIDEgMCAyeiIvPjwvc3ZnPg=="],
  [QueueInteractionScore.AGAIN, "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzNiAzNiI+PHBhdGggZmlsbD0iI0REMkU0NCIgZD0iTTIxLjUzMyAxOC4wMDIgMzMuNzY4IDUuNzY4YTIuNSAyLjUgMCAwIDAtMy41MzUtMy41MzVMMTcuOTk4IDE0LjQ2NyA1Ljc2NCAyLjIzM2EyLjQ5OCAyLjQ5OCAwIDAgMC0zLjUzNSAwIDIuNDk4IDIuNDk4IDAgMCAwIDAgMy41MzVsMTIuMjM0IDEyLjIzNEwyLjIwMSAzMC4yNjVhMi40OTggMi40OTggMCAwIDAgMS43NjggNC4yNjdjLjY0IDAgMS4yOC0uMjQ0IDEuNzY4LS43MzJsMTIuMjYyLTEyLjI2MyAxMi4yMzQgMTIuMjM0YTIuNDkzIDIuNDkzIDAgMCAwIDEuNzY4LjczMiAyLjUgMi41IDAgMCAwIDEuNzY4LTQuMjY3TDIxLjUzMyAxOC4wMDJ6Ii8+PC9zdmc+"],
  [QueueInteractionScore.HARD, "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzNiAzNiI+PHBhdGggZmlsbD0iI0ZGQ0M0RCIgZD0iTTM2IDE4YzAgOS45NDEtOC4wNTkgMTgtMTggMTgtOS45NCAwLTE4LTguMDU5LTE4LTE4QzAgOC4wNiA4LjA2IDAgMTggMGM5Ljk0MSAwIDE4IDguMDYgMTggMTgiLz48ZWxsaXBzZSBmaWxsPSIjNjY0NTAwIiBjeD0iMTIiIGN5PSIxMy41IiByeD0iMi41IiByeT0iMy41Ii8+PGVsbGlwc2UgZmlsbD0iIzY2NDUwMCIgY3g9IjI0IiBjeT0iMTMuNSIgcng9IjIuNSIgcnk9IjMuNSIvPjxwYXRoIGZpbGw9IiNGRkYiIGQ9Ik0yNSAyMWE0IDQgMCAwIDEgMCA4SDExYTQgNCAwIDAgMSAwLThoMTR6Ii8+PHBhdGggZmlsbD0iIzY2NDUwMCIgZD0iTTI1IDIwSDExYy0yLjc1NyAwLTUgMi4yNDMtNSA1czIuMjQzIDUgNSA1aDE0YzIuNzU3IDAgNS0yLjI0MyA1LTVzLTIuMjQzLTUtNS01em0wIDJhMi45OTcgMi45OTcgMCAwIDEgMi45NDkgMi41SDI0LjVWMjJoLjV6bS0xLjUgMHYyLjVoLTNWMjJoM3ptLTQgMHYyLjVoLTNWMjJoM3ptLTQgMHYyLjVoLTNWMjJoM3pNMTEgMjJoLjV2Mi41SDguMDUxQTIuOTk3IDIuOTk3IDAgMCAxIDExIDIyem0wIDZhMi45OTcgMi45OTcgMCAwIDEtMi45NDktMi41SDExLjVWMjhIMTF6bTEuNSAwdi0yLjVoM1YyOGgtM3ptNCAwdi0yLjVoM1YyOGgtM3ptNCAwdi0yLjVoM1YyOGgtM3ptNC41IDBoLS41di0yLjVoMy40NDlBMi45OTcgMi45OTcgMCAwIDEgMjUgMjh6Ii8+PC9zdmc+"],
  [QueueInteractionScore.GOOD, "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzNiAzNiI+PHBhdGggZmlsbD0iI0ZGQ0M0RCIgZD0iTTM2IDE4YzAgOS45NDEtOC4wNTkgMTgtMTggMTgtOS45NCAwLTE4LTguMDU5LTE4LTE4QzAgOC4wNiA4LjA2IDAgMTggMGM5Ljk0MSAwIDE4IDguMDYgMTggMTgiLz48cGF0aCBmaWxsPSIjNjY0NTAwIiBkPSJNMjguNDU3IDE3Ljc5N2MtLjA2LS4xMzUtMS40OTktMy4yOTctNC40NTctMy4yOTctMi45NTcgMC00LjM5NyAzLjE2Mi00LjQ1NyAzLjI5N2EuNTAzLjUwMyAwIDAgMCAuNzU1LjYwNWMuMDEyLS4wMDkgMS4yNjItLjkwMiAzLjcwMi0uOTAyIDIuNDI2IDAgMy42NzQuODgxIDMuNzAyLjkwMWEuNDk4LjQ5OCAwIDAgMCAuNzU1LS42MDR6bS0xMiAwYy0uMDYtLjEzNS0xLjQ5OS0zLjI5Ny00LjQ1Ny0zLjI5Ny0yLjk1NyAwLTQuMzk3IDMuMTYyLTQuNDU3IDMuMjk3YS40OTkuNDk5IDAgMCAwIC43NTQuNjA1QzguMzEgMTguMzkzIDkuNTU5IDE3LjUgMTIgMTcuNWMyLjQyNiAwIDMuNjc0Ljg4MSAzLjcwMi45MDFhLjQ5OC40OTggMCAwIDAgLjc1NS0uNjA0ek0xOCAyMmMtMy42MjMgMC02LjAyNy0uNDIyLTktMS0uNjc5LS4xMzEtMiAwLTIgMiAwIDQgNC41OTUgOSAxMSA5IDYuNDA0IDAgMTEtNSAxMS05IDAtMi0xLjMyMS0yLjEzMi0yLTItMi45NzMuNTc4LTUuMzc3IDEtOSAxeiIvPjxwYXRoIGZpbGw9IiNGRkYiIGQ9Ik05IDIzczMgMSA5IDEgOS0xIDktMS0yIDQtOSA0LTktNC05LTR6Ii8+PC9zdmc+"],
  [QueueInteractionScore.EASY, "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzNiAzNiI+PHBhdGggZmlsbD0iI0Y0OTAwQyIgZD0iTTE0LjE3NCAxNy4wNzUgNi43NSA3LjU5NGwtMy43MjIgOS40ODF6Ii8+PHBhdGggZmlsbD0iI0Y0OTAwQyIgZD0ibTE3LjkzOCA1LjUzNC02LjU2MyAxMi4zODlIMjQuNXoiLz48cGF0aCBmaWxsPSIjRjQ5MDBDIiBkPSJtMjEuODI2IDE3LjA3NSA3LjQyNC05LjQ4MSAzLjcyMiA5LjQ4MXoiLz48cGF0aCBmaWxsPSIjRkZDQzREIiBkPSJNMjguNjY5IDE1LjE5IDIzLjg4NyAzLjUyM2wtNS44OCAxMS42NjgtLjAwNy4wMDMtLjAwNy0uMDA0LTUuODgtMTEuNjY4TDcuMzMxIDE1LjE5QzQuMTk3IDEwLjgzMyAxLjI4IDguMDQyIDEuMjggOC4wNDJTMyAyMC43NSAzIDMzaDMwYzAtMTIuMjUgMS43Mi0yNC45NTggMS43Mi0yNC45NThzLTIuOTE3IDIuNzkxLTYuMDUxIDcuMTQ4eiIvPjxjaXJjbGUgZmlsbD0iIzVDOTEzQiIgY3g9IjE3Ljk1NyIgY3k9IjIyIiByPSIzLjY4OCIvPjxjaXJjbGUgZmlsbD0iIzk4MUNFQiIgY3g9IjI2LjQ2MyIgY3k9IjIyIiByPSIyLjQxMiIvPjxjaXJjbGUgZmlsbD0iI0REMkU0NCIgY3g9IjMyLjg1MiIgY3k9IjIyIiByPSIxLjk4NiIvPjxjaXJjbGUgZmlsbD0iIzk4MUNFQiIgY3g9IjkuNDUiIGN5PSIyMiIgcj0iMi40MTIiLz48Y2lyY2xlIGZpbGw9IiNERDJFNDQiIGN4PSIzLjA2MSIgY3k9IjIyIiByPSIxLjk4NiIvPjxwYXRoIGZpbGw9IiNGRkFDMzMiIGQ9Ik0zMyAzNEgzYTEgMSAwIDEgMSAwLTJoMzBhMSAxIDAgMSAxIDAgMnptMC0zLjQ4NkgzYTEgMSAwIDEgMSAwLTJoMzBhMSAxIDAgMSAxIDAgMnoiLz48Y2lyY2xlIGZpbGw9IiNGRkNDNEQiIGN4PSIxLjQ0NyIgY3k9IjguMDQyIiByPSIxLjQwNyIvPjxjaXJjbGUgZmlsbD0iI0Y0OTAwQyIgY3g9IjYuNzUiIGN5PSI3LjU5NCIgcj0iMS4xOTIiLz48Y2lyY2xlIGZpbGw9IiNGRkNDNEQiIGN4PSIxMi4xMTMiIGN5PSIzLjUyMyIgcj0iMS43ODQiLz48Y2lyY2xlIGZpbGw9IiNGRkNDNEQiIGN4PSIzNC41NTMiIGN5PSI4LjA0MiIgcj0iMS40MDciLz48Y2lyY2xlIGZpbGw9IiNGNDkwMEMiIGN4PSIyOS4yNSIgY3k9IjcuNTk0IiByPSIxLjE5MiIvPjxjaXJjbGUgZmlsbD0iI0ZGQ0M0RCIgY3g9IjIzLjg4NyIgY3k9IjMuNTIzIiByPSIxLjc4NCIvPjxjaXJjbGUgZmlsbD0iI0Y0OTAwQyIgY3g9IjE3LjkzOCIgY3k9IjUuNTM0IiByPSIxLjc4NCIvPjwvc3ZnPg=="]
]);

// One Entry in the History List
interface RemHistoryItemProps {
  data: HistoryData;
  remId: string;
  setData: (changes: Partial<HistoryData>) => void;
  closeIndex: () => void;
}

function RemHistoryItem({
  data,
  remId,
  setData,
  closeIndex,
}: RemHistoryItemProps) {

  const plugin = usePlugin();

  const scoreImage = scoreToImage.get(data.score);

  //
  const openRem = async (remId: RemId) => {
    const rem = await plugin.rem.findOne(remId);
    if (rem) {
      plugin.window.openRem(rem);
    }
  };

  return (
    <div className="px-1 py-4 w-full" key={remId}>
      {/* List Item */}
      <div className="flex gap-2 mb-2 w-full"> 
        {/* Score */}
        <div
          className="flex items-center justify-center flex-shrink-0 w-6 h-6 rounded-md cursor-pointer hover:rn-clr-background--hovered"
        >
          <img
            src={scoreImage}
          />
        </div>
        {/* Chevron */}
        <div
          className="flex items-center justify-center flex-shrink-0 w-6 h-6 rounded-md cursor-pointer hover:rn-clr-background--hovered"
          onClick={() => setData({ open: !data.open })} // data.open = !data.open
        >
          <img
            src={`${plugin.rootURL}chevron_down.svg`}
            style={{
              transform: `rotate(${data.open ? 0 : -90}deg)`,
              transitionProperty: "transform",
              transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
              transitionDuration: "150ms",
            }}
          />
        </div>
        {/* RemViewer */}
        <div className="flex-grow min-w-0 w-full" onClick={() => openRem(remId)}>
          <RemViewer
            remId={remId}
            //constraintRef="parent"// ERROR: No overload matches this call.Overload 1 of 2, '(props: RemViewerProps | Readonly<RemViewerProps>): RemViewer', gave the following error.Type '{ remId: string; constraintRef: string; maxWidth: string; className: string; }' is not assignable to type 'IntrinsicAttributes & IntrinsicClassAttributes<RemViewer> & Readonly<RemViewerProps> & Readonly<...>'.Property 'constraintRef' does not exist on type 'IntrinsicAttributes & IntrinsicClassAttributes<RemViewer> & Readonly<RemViewerProps> & Readonly<...>'.Overload 2 of 2, '(props: RemViewerProps, context: any): RemViewer', gave the following error.Type '{ remId: string; constraintRef: string; maxWidth: string; className: string; }' is not assignable to type 'IntrinsicAttributes & IntrinsicClassAttributes<RemViewer> & Readonly<RemViewerProps> & Readonly<...>'.Property 'constraintRef' does not exist on type 'IntrinsicAttributes & IntrinsicClassAttributes<RemViewer> & Readonly<RemViewerProps> & Readonly<...>'
            maxWidth="100%"
            width="100%"
            className="w-full font-semibold cursor-pointer line-clamp-2"
          />
          <div className="text-xs rn-clr-content-tertiary">
            {timeSince(new Date(data.time))}
          </div>
        </div>
        {/* Delete */}
        <div 
          className="flex items-center justify-center flex-shrink-0 w-6 h-6 rounded-md cursor-pointer hover:rn-clr-background--hovered"
          onClick={closeIndex}
        >
          <img
            src={`${plugin.rootURL}close.svg`}
            style={{
              display: "inline-block",
              fill: "var(--rn-clr-content-tertiary)",
              color: "color",
              width: 16,
              height: 16,
            }}
          />
        </div>
      </div>
      {/* RemTree */}
      {data.open && (
        <div className="m-2" style={{ borderBottomWidth: 1 }}>
          <RemHierarchyEditorTree  width="100%" remId={remId} />
        </div>
      )}
    </div>
  );
}

renderWidget(cardHistorySidebar);
