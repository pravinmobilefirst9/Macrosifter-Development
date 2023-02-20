import {Component} from '@angular/core';
import {TopicInput} from "@ghostfolio/client/components/landing-topic-block/landing-topic-block.component";

@Component({
  host: { class: 'page' },
  selector: 'gf-landing-page',
  template: `
    <ms-sub-landing [data]="data"></ms-sub-landing>
  `
})
export class MacroeconomicsComponent {

  data = {
    bannerData: {
      title: 'Macroeconomics Simplified',
      text: 'We live in a world full of overwhelming access to data and opinions that never end. Cut through the noise and focus on tried & true objective data to understand the direction of the economy.',
      buttonText: 'Try for free',
      buttonRoute: '/register',
      showButton: true,
      showImages: false,
    },
    topics: [
      new TopicInput(
        'The News Cycle',
        'Never Ends',
        'In 2020, the narrative was that inflation was dead. In 2023, the narrative is that inflation will never end. Add that in with a million opinions on what will happen tomorrow, next week, next month, next quarter, next year, and it’s very easy to become overwhelmed and confused.',
        'assets/images/image01_macro.png'
      ),
      new TopicInput(
        'Objective Data',
        'Wins',
        'While it’s impossible to predict what actually happens next, we can understand probable paths with objective data that can be helpful in the decision making process. Over the last decade, we’ve honed in on a number of broad indicators that paint a picture for the direction of the economy. ',
        'assets/images/image02_macro.png',
        'left'
      ),
      new TopicInput(
        'Several Objective Methodologies is',
        'better than one',
        'We don’t look at just one objective methodology. We’ve identified multiple objective methodologies so you can see where the economy may be headed at a given point in tim',
        'assets/images/image03_macro.png'
      ),
    ],
  }

  public constructor() {}

}
