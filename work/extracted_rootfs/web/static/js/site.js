function openNav() {
  $('.sidenav').addClass('active');
  $('.overlay').css('display', 'block');
  $('body').css('overflow', 'hidden');
}

function closeNav() {
  $('.sidenav').removeClass('active');
  $('.overlay').css('display', 'none');
  $('body').css('overflow', 'auto');
  $('.sidenav .sub').addClass('menu-close');
}

function hidePassword(id) {
  $('#' + id).attr('type', 'password');
  $('#' + id)
    .parent()
    .siblings()
    .find('span.icon-visibility-off-disable')
    .addClass('icon-visibility-on')
    .removeClass('icon-visibility-off-disable');
}

function showPassword(id) {
  $('#' + id).attr('type', 'text');
  $('#' + id)
    .parent()
    .siblings()
    .find('span.icon-visibility-on')
    .addClass('icon-visibility-off-disable')
    .removeClass('icon-visibility-on');
}

function reloadOnF5(router) {
  document.onkeydown = function (event) {
    if (
      event.key == 'F5' ||
      event.code == 'F5' ||
      event.which == 116 ||
      event.keyCode == 116
    ) {
      event.returnValue = false;
      //router.push('/');
	  router.go(router.currentRoute)
    }
  };
}
