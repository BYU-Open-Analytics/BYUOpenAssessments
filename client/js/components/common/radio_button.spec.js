import React              from 'react';
import TestUtils          from '../../../node_modules/react/lib/ReactTestUtils';
import RadioButton        from './radio_button';

describe('radio button', function() {

  var item = {
    id: 1,
    material: "The radio button label"
  };
  var result = TestUtils.renderIntoDocument(<RadioButton item={item} name="answer-radio" />);

  it('renders the radio button label', function() {
    expect(React.findDOMNode(result).textContent).toContain(item.material);
  });

  it('renders input attributes', function() {
    expect(React.findDOMNode(result).childNodes[0].childNodes[0].attributes.name.value).toContain("answer-radio");
  });

  it('calls the answerSelected function on click', () => {
    spyOn(result, "answerSelected");
    var radio = TestUtils.findRenderedDOMComponentWithTag(result, 'input');
    TestUtils.Simulate.click(radio);
    expect(result.answerSelected).toHaveBeenCalled();
  });

});
