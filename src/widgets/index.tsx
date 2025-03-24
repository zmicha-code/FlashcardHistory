import {
  Card,
  declareIndexPlugin,
  ReactRNPlugin,
  RemId,
  WidgetLocation,
  AppEvents,
  useTracker, Rem, RichTextInterface, RichTextElementInterface
} from '@remnote/plugin-sdk';
import { HistoryData } from "../types/HistoryData";
import '../style.css';
import '../App.css';

function extractText(textArray: RichTextInterface): string {
  return textArray.reduce((acc: string, curr: RichTextElementInterface) => {
    if (typeof curr === 'string') {
      return acc + curr; // Direkter String wird angehängt
    } else if (curr && 'text' in curr) {
      return acc + (curr.text || ''); // Text aus dem Objekt wird angehängt
    }
    return acc; // Andere Fälle werden ignoriert
  }, '');
}

async function onActivate(plugin: ReactRNPlugin) {

  await plugin.app.registerWidget(
    "cardHistory",
    WidgetLocation.RightSidebar,
    {
      dimensions: { height: "auto", width: "100%" },
      widgetTabTitle: "Flashcard History", // not working?
      widgetTabIcon: "https://i.imgur.com/MLaBDJw.png",
    }
  );
  
  // Each time the user opens a Rem, we record this event in synced storage.
  // We can use the useSyncedStorage hook in widget components to reactively
  // get this list of history entries.
  //
  // Since we are using synced storage, the data persists between refreshes
  // and gets synced between devices.
  plugin.event.addListener( AppEvents.QueueCompleteCard,
    undefined,
    async (message) => {
      //const currentRemId = message.remId as RemId;
      const cardId = message.cardId as string;

      // Fetch the card and get its remId
      const card = await plugin.card.findOne(cardId);
      const currentRemId = card?.remId as RemId;

      //console.log(await card?.getRem())

      //
      const currentScore = card?.repetitionHistory?.[card?.repetitionHistory?.length-1]?.score;

      const r = await card?.getRem();
    
      //const currentRemData = (await plugin.storage.getSynced("remData")) || [];
      const currentRemData: HistoryData[] = (await plugin.storage.getSynced("cardData")) || [];
  
      if (currentRemData[0]?.remId != currentRemId) {
        await plugin.storage.setSynced("cardData", [{ key: Math.random(),
                                                      remId: currentRemId,
                                                      open: false,
                                                      time: new Date().getTime(),
                                                      score : currentScore,
                                                      question: extractText(r?.text || [])
                                                    },
                                                    ...currentRemData,]);
      }
    });
}

async function onDeactivate(_: ReactRNPlugin) {}

declareIndexPlugin(onActivate, onDeactivate);
