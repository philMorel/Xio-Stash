if (pre.querySelector('a')) {
          var anchorElement = pre.querySelector('a')
          var hrefValue = anchorElement.href;
          const regex = /%22id%22:%22(\d+)%22/;
          var match = hrefValue.match(regex);
          if (match && match[1]) {
            hrefValue = match[1]; // Return the captured group (the ID)
            hrefValue = "tag/" + hrefValue + '/image?';
          }else{
            hrefValue = hrefValue.replace('/tags/','/tag/');
            hrefValue = hrefValue  + '/image?';
          }
          var final_value = '<img style="height:70px;" src="' + hrefValue + '" />'
          if (!anchorElement.innerHTML.startsWith('<img')) {
            anchorElement.innerHTML = final_value + pre.innerHTML
          }
          }
