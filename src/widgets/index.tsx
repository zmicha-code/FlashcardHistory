import {
  Card,
  declareIndexPlugin,
  ReactRNPlugin,
  RemId,
  WidgetLocation,
  AppEvents,
  useTracker, Rem, RichTextInterface, RichTextElementInterface,
  RNPlugin,
  RemType
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

// -> AbstractionAndInheritance
async function getRemText(plugin: RNPlugin, rem: Rem | undefined, extentedName = false): Promise<string> {
    if (!rem) return "";

    let richText = rem.text;

    // Special case, where text of rem only consists of a reference.
    // q: Ref
    // m: Link
    if(richText && richText.length == 1 && (richText[0].i == 'q' || richText[0].i == 'm')) {

      let propertyText = "";

      if(richText[0].i == 'q') {
        const referencedRem = await plugin.rem.findOne(richText[0]._id);
        propertyText = await getRemText(plugin, referencedRem)
      }

      if(richText[0].i == 'm') {
        propertyText = richText[0].text;
      }

      const parentRem =  rem.getParentRem ? await rem.getParentRem() : await (await plugin.rem.findOne(rem._id))?.getParentRem(); // await rem.getParentRem() -> "getParentRem is not a function"
      const parentText = parentRem ? await getRemText(plugin, parentRem) : "";

      return parentText + " > " + propertyText;
    }

    const textPartsPromises = richText ? richText.map(async (item) => {
    if (typeof item === "string") {
      if(extentedName && await rem.getType() == RemType.DESCRIPTOR) {
        const parentRem = await rem.getParentRem();

        if(parentRem)
            return await getRemText(plugin, parentRem) + ">" + item;
      }
      return item;
    }

    switch (item.i) {
    case 'q':
      const referencedRem = await plugin.rem.findOne(item._id);
      if (referencedRem) {
          if(extentedName) {
          const refParentRem = await rem.getParentRem();

          if(refParentRem)
              return await getRemText(plugin, refParentRem, true) + ">" + await getRemText(plugin, referencedRem);
          }

          return await getRemText(plugin, referencedRem);
      } else if (item.textOfDeletedRem) {
          return await processRichText(plugin, item.textOfDeletedRem);
      }
      return "";
    case 'i': return item.url;
    case 'a': return item.url;
    case 'p': return item.url;
    case 'g': return item._id || "";
    case 'm':
    case 'x': 
    case 'n':
      if(extentedName && await rem.getType() == RemType.DESCRIPTOR) {
          const parentRem = await rem.getParentRem();

          if(parentRem)
              return await getRemText(plugin, parentRem) + ">" + item.text;
      }
      return item.text;
      case 's': return "";
      default: return "";
    }
    }) : [];

    const textParts = await Promise.all(textPartsPromises);

    if(rem.isSlot && await rem.isSlot())
        return await getRemText(plugin, await rem.getParentRem()) + " > " + textParts.join("");
    else
        return textParts.join("");
}

// -> AbstractionAndInheritance
async function processRichText(plugin: RNPlugin, richText: RichTextInterface, showAlias = false): Promise<string> {
    const textPartsPromises = richText.map(async (item) => {
    if (typeof item === "string") {
    return item;
    }
    switch (item.i) {
    case 'm': return item.text;
    case 'q':
    const id = showAlias && item.aliasId ? item.aliasId : item._id;
    
    const referencedRem = await plugin.rem.findOne(id);
    if (referencedRem) {
        return await getRemText(plugin, referencedRem);
    } else if (item.textOfDeletedRem) {
        return await processRichText(plugin, item.textOfDeletedRem);
    }
    return "";
    case 'i': return item.url;
    case 'a': return item.url;
    case 'p': return item.url;
    case 'g': return item._id || "";
    case 'x': return item.text;
    case 'n': return item.text;
    case 's': return "";
    default: return "";
    }
    });

    const textParts = await Promise.all(textPartsPromises);
    return textParts.join("");
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
