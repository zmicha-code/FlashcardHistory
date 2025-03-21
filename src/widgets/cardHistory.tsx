import React, { useEffect } from "react";
import {
  RemHierarchyEditorTree,
  RemId,
  RemViewer,
  renderWidget,
  usePlugin,
  useSyncedStorageState,
  QueueInteractionScore,
} from "@remnote/plugin-sdk";
import MyRemNoteButton from '../components/MyRemNoteButton';
import { HistoryData } from "../types/HistoryData";
import { timeSince } from '../utils/TimeAndDate';

const NUM_TO_LOAD_IN_BATCH = 20;

function cardHistorySidebar() {
  const [remData, setRemData] = useSyncedStorageState<HistoryData[]>(
    "cardData",
    []
  );

  // Remove from History
  const closeIndex = (index: number) => { 
    // This code directly modifies remData (mutates it), which isn’t ideal in React because state should be immutable.
    //remData.splice(index, 1);
    //setRemData(remData);
    const newData = [...remData]; // Create a copy
    newData.splice(index, 1);
    setRemData(newData);
  };

  // Partial is a TypeScript utility type, not a class. It makes all properties of HistoryData optional. So, changes can include just some properties of HistoryData (e.g., { open: true }) without needing to provide everything.
  // Creates a new object by merging oldData with changes using the spread operator. For example, if changes = { open: true }, it updates open while keeping other properties intact.
  // Replaces the old object at index with newData
  // Change name from setData to updateData
  const updateData = (index: number, changes: Partial<HistoryData>) => { 
    //const oldData = remData[index];
    //const newData = { ...oldData, ...changes }; 
    //remData.splice(index, 1, newData); 
    //setRemData(remData);
    const newDataArray = [...remData];
    newDataArray[index] = { ...remData[index], ...changes };
    setRemData(newDataArray);
  };

  // Think of it as a variable (numLoaded) and its setter (setNumLoaded).
  // Initial value 1
  const [numLoaded, setNumLoaded] = React.useState(1);

  // It’s a hook for handling side effects (e.g., things that happen after rendering, like resetting values).
  // This useEffect runs whenever remData.length changes (due to the dependency array [remData.length]). When it runs, it calls setNumLoaded(1), resetting numLoaded to 1.
  // Why? If the history data changes (e.g., items are added or removed), it restarts the display from the first batch.
  useEffect(() => {
    setNumLoaded(1);
  }, [remData.length]);

  const numUnloaded = Math.max(0, remData.length - NUM_TO_LOAD_IN_BATCH * numLoaded);

  // Rendering Logic
  return (
    <div
      className="h-full w-full overflow-y-auto rn-clr-background-primary hover:bg-gray-400"
      //This stops the mouseDown event from “bubbling up” to parent elements. For example, clicking in the sidebar won’t trigger actions in the main app, keeping interactions isolated.
      onMouseDown={(e) => e.stopPropagation()} // What does this do?
    >
      {/* Toolbar with Reset Button */}
      <div className="p-2 flex justify-end">
      <MyRemNoteButton
        img="M3.32104 8.64925C3.32104 9.29895 3.44155 9.90847 3.68257 10.4778C3.92708 11.0437 4.2624 11.5414 4.68854 11.9711C5.11469 12.4007 5.61069 12.7343 6.17655 12.9718C6.74591 13.2128 7.35543 13.3333 8.00513 13.3333C8.65133 13.3333 9.25736 13.2128 9.82322 12.9718C10.3891 12.7343 10.8868 12.4007 11.3165 11.9711C11.7461 11.5414 12.0797 11.0437 12.3172 10.4778C12.5582 9.90847 12.6787 9.29895 12.6787 8.64925C12.6787 8.49207 12.6298 8.36458 12.532 8.26677C12.4377 8.16897 12.312 8.12007 12.1548 8.12007C12.0046 8.12007 11.8823 8.16897 11.788 8.26677C11.6972 8.36458 11.6518 8.49207 11.6518 8.64925C11.6518 9.15573 11.5575 9.63078 11.3689 10.0744C11.1802 10.5145 10.9183 10.904 10.5829 11.2428C10.2511 11.5781 9.86339 11.8401 9.41978 12.0287C8.97967 12.2138 8.50811 12.3064 8.00513 12.3064C7.49515 12.3064 7.02011 12.2138 6.57999 12.0287C6.13988 11.8401 5.75216 11.5781 5.41683 11.2428C5.085 10.904 4.82477 10.5145 4.63615 10.0744C4.44753 9.63078 4.35322 9.15573 4.35322 8.64925C4.35322 8.13928 4.44578 7.66249 4.63091 7.21888C4.81953 6.77527 5.07976 6.38755 5.41159 6.05572C5.74342 5.72039 6.12765 5.45842 6.56427 5.2698C7.00439 5.08118 7.47943 4.98687 7.98941 4.98687C8.16056 4.98687 8.32473 4.9956 8.48192 5.01307C8.6391 5.02704 8.78406 5.04799 8.91679 5.07594L7.49166 6.48535C7.44625 6.53426 7.40957 6.5884 7.38163 6.64778C7.35718 6.70367 7.34495 6.76479 7.34495 6.83116C7.34495 6.97437 7.39385 7.09488 7.49166 7.19268C7.58946 7.29049 7.70822 7.33939 7.84794 7.33939C7.99814 7.33939 8.11865 7.29223 8.20946 7.19792L10.3576 5.02878C10.4135 4.9729 10.4537 4.91352 10.4782 4.85064C10.5061 4.78777 10.5201 4.7214 10.5201 4.65154C10.5201 4.50484 10.4659 4.37909 10.3576 4.2743L8.20946 2.0842C8.11515 1.9864 7.99465 1.9375 7.84794 1.9375C7.70473 1.9375 7.58422 1.98815 7.48642 2.08944C7.39211 2.18725 7.34495 2.3095 7.34495 2.45621C7.34495 2.52257 7.35718 2.58545 7.38163 2.64483C7.40608 2.70072 7.44101 2.75311 7.48642 2.80201L8.75437 4.05424C8.63561 4.02979 8.51161 4.01058 8.38237 3.99661C8.25662 3.98264 8.12563 3.97565 7.98941 3.97565C7.33971 3.97565 6.73194 4.09791 6.16607 4.34241C5.6037 4.58343 5.10945 4.91701 4.68331 5.34315C4.25716 5.76929 3.92358 6.2653 3.68257 6.83116C3.44155 7.39702 3.32104 8.00305 3.32104 8.64925Z"
        text="Reset Flashcards"
        onClick={() => setRemData([])}
      />
      </div>
      {/* Notification (no flashcards) */}
      {remData.length == 0 && (
        <div className="rn-clr-content-primary">
          Do more flashcards.
        </div>
      )}
      {/* List of flashcards */}
      {/*Slice a fraction of the history to be displayed. map((data, i) => ...) loops over those items, rendering a <RemHistoryItem> for each one. data is the item, i is its index in the sliced array.*/}
      {remData.slice(0, NUM_TO_LOAD_IN_BATCH * numLoaded).map((data, i) => (
        <RemHistoryItem
          data={data}
          remId={data.remId}
          key={data.key || Math.random()}
          setData={(c) => updateData(i, c)}
          closeIndex={() => closeIndex(i)}
        />
      ))}
      {/* Load more */}
      {numUnloaded > 0 && (
        <div
          onMouseOver={() => setNumLoaded((i) => i + 1)}
          className="pb-[200px]"
        >
          {" "}
          Load more{" "}
          <span className="rn-clr-content-secondary">({numUnloaded})</span>
        </div>
      )}
    </div>
  );
}

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

  const scoreToImage = new Map<QueueInteractionScore, string>([
    [QueueInteractionScore.TOO_EARLY, "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzNiAzNiI+PHBhdGggZmlsbD0iI0ZGQ0M0RCIgZD0iTTIwIDYuMDQyYzAgMS4xMTItLjkwMyAyLjAxNC0yIDIuMDE0cy0yLS45MDItMi0yLjAxNFYyLjAxNEMxNiAuOTAxIDE2LjkwMyAwIDE4IDBzMiAuOTAxIDIgMi4wMTR2NC4wMjh6Ii8+PHBhdGggZmlsbD0iI0ZGQUMzMyIgZD0iTTkuMTggMzZjLS4yMjQgMC0uNDUyLS4wNTItLjY2Ni0uMTU5YTEuNTIxIDEuNTIxIDAgMCAxLS42NjctMi4wMjdsOC45NC0xOC4xMjdjLjI1Mi0uNTEyLjc2OC0uODM1IDEuMzMzLS44MzVzMS4wODEuMzIzIDEuMzMzLjgzNWw4Ljk0MSAxOC4xMjdhMS41MiAxLjUyIDAgMCAxLS42NjYgMi4wMjcgMS40ODIgMS40ODIgMCAwIDEtMS45OTktLjY3NkwxOC4xMjEgMTkuNzRsLTcuNjA3IDE1LjQyNUExLjQ5IDEuNDkgMCAwIDEgOS4xOCAzNnoiLz48cGF0aCBmaWxsPSIjNTg1OTVCIiBkPSJNMTguMTIxIDIwLjM5MmEuOTg1Ljk4NSAwIDAgMS0uNzAyLS4yOTVMMy41MTIgNS45OThjLS4zODgtLjM5NC0uMzg4LTEuMDMxIDAtMS40MjRzMS4wMTctLjM5MyAxLjQwNCAwTDE4LjEyMSAxNy45NiAzMS4zMjQgNC41NzNhLjk4NS45ODUgMCAwIDEgMS40MDUgMCAxLjAxNyAxLjAxNyAwIDAgMSAwIDEuNDI0bC0xMy45MDUgMTQuMWEuOTkyLjk5MiAwIDAgMS0uNzAzLjI5NXoiLz48cGF0aCBmaWxsPSIjREQyRTQ0IiBkPSJNMzQuMDE1IDE5LjM4NWMwIDguODk4LTcuMTE1IDE2LjExMS0xNS44OTQgMTYuMTExLTguNzc3IDAtMTUuODkzLTcuMjEzLTE1Ljg5My0xNi4xMTEgMC04LjkgNy4xMTYtMTYuMTEzIDE1Ljg5My0xNi4xMTMgOC43NzgtLjAwMSAxNS44OTQgNy4yMTMgMTUuODk0IDE2LjExM3oiLz48cGF0aCBmaWxsPSIjRTZFN0U4IiBkPSJNMzAuMDQxIDE5LjM4NWMwIDYuNjc0LTUuMzM1IDEyLjA4NC0xMS45MiAxMi4wODQtNi41ODMgMC0xMS45MTktNS40MS0xMS45MTktMTIuMDg0QzYuMjAyIDEyLjcxIDExLjUzOCA3LjMgMTguMTIxIDcuM2M2LjU4NS0uMDAxIDExLjkyIDUuNDEgMTEuOTIgMTIuMDg1eiIvPjxwYXRoIGZpbGw9IiNGRkNDNEQiIGQ9Ik0zMC4wNCAxLjI1N2E1Ljg5OSA1Ljg5OSAwIDAgMC00LjIxNCAxLjc3bDguNDI5IDguNTQ0QTYuMDY0IDYuMDY0IDAgMCAwIDM2IDcuMjk5YzAtMy4zMzYtMi42NjktNi4wNDItNS45Ni02LjA0MnptLTI0LjA4IDBhNS45IDUuOSAwIDAgMSA0LjIxNCAxLjc3bC04LjQyOSA4LjU0NEE2LjA2NCA2LjA2NCAwIDAgMSAwIDcuMjk5YzAtMy4zMzYgMi42NjgtNi4wNDIgNS45Ni02LjA0MnoiLz48cGF0aCBmaWxsPSIjNDE0MDQyIiBkPSJNMjMgMjBoLTVhMSAxIDAgMCAxLTEtMXYtOWExIDEgMCAwIDEgMiAwdjhoNGExIDEgMCAxIDEgMCAyeiIvPjwvc3ZnPg=="],
    [QueueInteractionScore.AGAIN, "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzNiAzNiI+PHBhdGggZmlsbD0iI0REMkU0NCIgZD0iTTIxLjUzMyAxOC4wMDIgMzMuNzY4IDUuNzY4YTIuNSAyLjUgMCAwIDAtMy41MzUtMy41MzVMMTcuOTk4IDE0LjQ2NyA1Ljc2NCAyLjIzM2EyLjQ5OCAyLjQ5OCAwIDAgMC0zLjUzNSAwIDIuNDk4IDIuNDk4IDAgMCAwIDAgMy41MzVsMTIuMjM0IDEyLjIzNEwyLjIwMSAzMC4yNjVhMi40OTggMi40OTggMCAwIDAgMS43NjggNC4yNjdjLjY0IDAgMS4yOC0uMjQ0IDEuNzY4LS43MzJsMTIuMjYyLTEyLjI2MyAxMi4yMzQgMTIuMjM0YTIuNDkzIDIuNDkzIDAgMCAwIDEuNzY4LjczMiAyLjUgMi41IDAgMCAwIDEuNzY4LTQuMjY3TDIxLjUzMyAxOC4wMDJ6Ii8+PC9zdmc+"],
    [QueueInteractionScore.HARD, "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzNiAzNiI+PHBhdGggZmlsbD0iI0ZGQ0M0RCIgZD0iTTM2IDE4YzAgOS45NDEtOC4wNTkgMTgtMTggMTgtOS45NCAwLTE4LTguMDU5LTE4LTE4QzAgOC4wNiA4LjA2IDAgMTggMGM5Ljk0MSAwIDE4IDguMDYgMTggMTgiLz48ZWxsaXBzZSBmaWxsPSIjNjY0NTAwIiBjeD0iMTIiIGN5PSIxMy41IiByeD0iMi41IiByeT0iMy41Ii8+PGVsbGlwc2UgZmlsbD0iIzY2NDUwMCIgY3g9IjI0IiBjeT0iMTMuNSIgcng9IjIuNSIgcnk9IjMuNSIvPjxwYXRoIGZpbGw9IiNGRkYiIGQ9Ik0yNSAyMWE0IDQgMCAwIDEgMCA4SDExYTQgNCAwIDAgMSAwLThoMTR6Ii8+PHBhdGggZmlsbD0iIzY2NDUwMCIgZD0iTTI1IDIwSDExYy0yLjc1NyAwLTUgMi4yNDMtNSA1czIuMjQzIDUgNSA1aDE0YzIuNzU3IDAgNS0yLjI0MyA1LTVzLTIuMjQzLTUtNS01em0wIDJhMi45OTcgMi45OTcgMCAwIDEgMi45NDkgMi41SDI0LjVWMjJoLjV6bS0xLjUgMHYyLjVoLTNWMjJoM3ptLTQgMHYyLjVoLTNWMjJoM3ptLTQgMHYyLjVoLTNWMjJoM3pNMTEgMjJoLjV2Mi41SDguMDUxQTIuOTk3IDIuOTk3IDAgMCAxIDExIDIyem0wIDZhMi45OTcgMi45OTcgMCAwIDEtMi45NDktMi41SDExLjVWMjhIMTF6bTEuNSAwdi0yLjVoM1YyOGgtM3ptNCAwdi0yLjVoM1YyOGgtM3ptNCAwdi0yLjVoM1YyOGgtM3ptNC41IDBoLS41di0yLjVoMy40NDlBMi45OTcgMi45OTcgMCAwIDEgMjUgMjh6Ii8+PC9zdmc+"],
    [QueueInteractionScore.GOOD, "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzNiAzNiI+PHBhdGggZmlsbD0iI0ZGQ0M0RCIgZD0iTTM2IDE4YzAgOS45NDEtOC4wNTkgMTgtMTggMTgtOS45NCAwLTE4LTguMDU5LTE4LTE4QzAgOC4wNiA4LjA2IDAgMTggMGM5Ljk0MSAwIDE4IDguMDYgMTggMTgiLz48cGF0aCBmaWxsPSIjNjY0NTAwIiBkPSJNMjguNDU3IDE3Ljc5N2MtLjA2LS4xMzUtMS40OTktMy4yOTctNC40NTctMy4yOTctMi45NTcgMC00LjM5NyAzLjE2Mi00LjQ1NyAzLjI5N2EuNTAzLjUwMyAwIDAgMCAuNzU1LjYwNWMuMDEyLS4wMDkgMS4yNjItLjkwMiAzLjcwMi0uOTAyIDIuNDI2IDAgMy42NzQuODgxIDMuNzAyLjkwMWEuNDk4LjQ5OCAwIDAgMCAuNzU1LS42MDR6bS0xMiAwYy0uMDYtLjEzNS0xLjQ5OS0zLjI5Ny00LjQ1Ny0zLjI5Ny0yLjk1NyAwLTQuMzk3IDMuMTYyLTQuNDU3IDMuMjk3YS40OTkuNDk5IDAgMCAwIC43NTQuNjA1QzguMzEgMTguMzkzIDkuNTU5IDE3LjUgMTIgMTcuNWMyLjQyNiAwIDMuNjc0Ljg4MSAzLjcwMi45MDFhLjQ5OC40OTggMCAwIDAgLjc1NS0uNjA0ek0xOCAyMmMtMy42MjMgMC02LjAyNy0uNDIyLTktMS0uNjc5LS4xMzEtMiAwLTIgMiAwIDQgNC41OTUgOSAxMSA5IDYuNDA0IDAgMTEtNSAxMS05IDAtMi0xLjMyMS0yLjEzMi0yLTItMi45NzMuNTc4LTUuMzc3IDEtOSAxeiIvPjxwYXRoIGZpbGw9IiNGRkYiIGQ9Ik05IDIzczMgMSA5IDEgOS0xIDktMS0yIDQtOSA0LTktNC05LTR6Ii8+PC9zdmc+"],
    [QueueInteractionScore.EASY, "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzNiAzNiI+PHBhdGggZmlsbD0iI0Y0OTAwQyIgZD0iTTE0LjE3NCAxNy4wNzUgNi43NSA3LjU5NGwtMy43MjIgOS40ODF6Ii8+PHBhdGggZmlsbD0iI0Y0OTAwQyIgZD0ibTE3LjkzOCA1LjUzNC02LjU2MyAxMi4zODlIMjQuNXoiLz48cGF0aCBmaWxsPSIjRjQ5MDBDIiBkPSJtMjEuODI2IDE3LjA3NSA3LjQyNC05LjQ4MSAzLjcyMiA5LjQ4MXoiLz48cGF0aCBmaWxsPSIjRkZDQzREIiBkPSJNMjguNjY5IDE1LjE5IDIzLjg4NyAzLjUyM2wtNS44OCAxMS42NjgtLjAwNy4wMDMtLjAwNy0uMDA0LTUuODgtMTEuNjY4TDcuMzMxIDE1LjE5QzQuMTk3IDEwLjgzMyAxLjI4IDguMDQyIDEuMjggOC4wNDJTMyAyMC43NSAzIDMzaDMwYzAtMTIuMjUgMS43Mi0yNC45NTggMS43Mi0yNC45NThzLTIuOTE3IDIuNzkxLTYuMDUxIDcuMTQ4eiIvPjxjaXJjbGUgZmlsbD0iIzVDOTEzQiIgY3g9IjE3Ljk1NyIgY3k9IjIyIiByPSIzLjY4OCIvPjxjaXJjbGUgZmlsbD0iIzk4MUNFQiIgY3g9IjI2LjQ2MyIgY3k9IjIyIiByPSIyLjQxMiIvPjxjaXJjbGUgZmlsbD0iI0REMkU0NCIgY3g9IjMyLjg1MiIgY3k9IjIyIiByPSIxLjk4NiIvPjxjaXJjbGUgZmlsbD0iIzk4MUNFQiIgY3g9IjkuNDUiIGN5PSIyMiIgcj0iMi40MTIiLz48Y2lyY2xlIGZpbGw9IiNERDJFNDQiIGN4PSIzLjA2MSIgY3k9IjIyIiByPSIxLjk4NiIvPjxwYXRoIGZpbGw9IiNGRkFDMzMiIGQ9Ik0zMyAzNEgzYTEgMSAwIDEgMSAwLTJoMzBhMSAxIDAgMSAxIDAgMnptMC0zLjQ4NkgzYTEgMSAwIDEgMSAwLTJoMzBhMSAxIDAgMSAxIDAgMnoiLz48Y2lyY2xlIGZpbGw9IiNGRkNDNEQiIGN4PSIxLjQ0NyIgY3k9IjguMDQyIiByPSIxLjQwNyIvPjxjaXJjbGUgZmlsbD0iI0Y0OTAwQyIgY3g9IjYuNzUiIGN5PSI3LjU5NCIgcj0iMS4xOTIiLz48Y2lyY2xlIGZpbGw9IiNGRkNDNEQiIGN4PSIxMi4xMTMiIGN5PSIzLjUyMyIgcj0iMS43ODQiLz48Y2lyY2xlIGZpbGw9IiNGRkNDNEQiIGN4PSIzNC41NTMiIGN5PSI4LjA0MiIgcj0iMS40MDciLz48Y2lyY2xlIGZpbGw9IiNGNDkwMEMiIGN4PSIyOS4yNSIgY3k9IjcuNTk0IiByPSIxLjE5MiIvPjxjaXJjbGUgZmlsbD0iI0ZGQ0M0RCIgY3g9IjIzLjg4NyIgY3k9IjMuNTIzIiByPSIxLjc4NCIvPjxjaXJjbGUgZmlsbD0iI0Y0OTAwQyIgY3g9IjE3LjkzOCIgY3k9IjUuNTM0IiByPSIxLjc4NCIvPjwvc3ZnPg=="]
  ]);

  const scoreImage = scoreToImage.get(data.score);

  const openRem = async (remId: RemId) => {
    const rem = await plugin.rem.findOne(remId);
    if (rem) {
      plugin.window.openRem(rem);
    }
  };

  return (
    <div className="px-1 py-4 w-full" key={remId}>
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
      {data.open && (
        <div className="m-2" style={{ borderBottomWidth: 1 }}>
          <RemHierarchyEditorTree  width="100%" remId={remId} />
        </div>
      )}
    </div>
  );
}

renderWidget(cardHistorySidebar);
