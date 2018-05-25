
// Header and Nav
$(document).ready(function() {
  const navbar = $('.navbar');
  const header = $('.header');

  let startX = null;
  let startY = null;
  let mouseX = 0;
  let mouseY = 0;
  const movementStrength = 25;
  const height = movementStrength / $(window).height();
  const width = movementStrength / $(window).width();
  let throttledHandler;
  const moveBackground = e => {
    mouseX = e.pageX || mouseX;
    mouseY = e.pageY || mouseY;
    if (throttledHandler) {
      return;
    }
    throttledHandler = requestAnimationFrame(() => {
      const followStateHeight = 500;

      if (window.scrollY > followStateHeight) {
        navbar.addClass('following');
      } else if (window.scrollY < followStateHeight) {
        navbar.removeClass('following');
      }
      const pageX = mouseX - ($(window).width() / 2);
      const pageY = mouseY - ($(window).height() / 2) + window.scrollY * 2;
      const newvalueX = width * (pageX - startX) * -1 - 100;
      let newvalueY = height * (pageY - startY) * -1 - 140;

      if (!startX) {
        startX = newvalueX;
      }

      if (!startY) {
        startY = newvalueY;
      }

      const newNavY = newvalueY - navbar[0].getBoundingClientRect().top;
      const newHeaderY = newvalueY - header[0].getBoundingClientRect().top;

      navbar.css('background-position', `${newvalueX - startX}px ${newNavY - startY}px`);
      header.css('background-position', `${newvalueX - startX}px ${newHeaderY - startY}px`);
      throttledHandler = undefined;
    });
  };

  navbar.mousemove(moveBackground);
  header.mousemove(moveBackground);
  let robotContainerPos = $('.case-studies-container').position().top;

  window.addEventListener('resize', function(e) {
    robotContainerPos = $('.case-studies-container').position().top;
  });

  window.addEventListener('scroll', (e) => {
    moveBackground(e);
    $('#gc-robot').css('top', (-window.scrollY + robotContainerPos - 100) / 2 + 'px');
  }, { passive: true });
  moveBackground({});

  $('#funder-toggle').click(function(e) {
    $('#funder-toggle').addClass('active');
    $('#contributor-toggle').removeClass('active');
  });
  $('#contributor-toggle').click(function(e) {
    $('#funder-toggle').removeClass('active');
    $('#contributor-toggle').addClass('active');
  });
});