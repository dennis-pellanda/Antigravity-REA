var sessionKey = 0
var enableCrossSiteTest = false;
var crossSiteURL = "http://192.168.1.1";

function deleteCookie(){
	document.cookie = "Authentication=; expires=Thu, 01 Jan 1970 00:00:01 GMT;"
}

function httpReqSendAndRecv(ctx){
	var object = "";
	var action = "";
	var timeOut = 30000
	var URL = ""
	var getvar = [];
	
	if(enableCrossSiteTest)
		URL = crossSiteURL + ctx.url
	else
		URL = ctx.url
	
	
	if(typeof ctx.action == "undefined"){
        action = "GET";
    }
	else{
		action = ctx.action;
	}
	
	if(typeof ctx.timeout != "undefined"){
        timeOut = ctx.timeout
    }
	
	if(ctx.Logout) getvar.push("Logout=" + ctx.Logout);
	if(ctx.timedelay) getvar.push("timedelay=" + ctx.timedelay);
    if((action == "POST" || action == "PUT" || action == "DELETE") && URL.search("cgi-bin") != -1){
        sessionKey = localStorage.getItem('zySessionKey')
		if(sessionKey != null)
			getvar.push("sessionkey=" + sessionKey);
	}
	
	if(action == "DELETE" || action == "GET" || action == "DEFAULT"){
		if(typeof(ctx.obj) === "object"){
			var str = Object.keys(ctx.obj).map(function(key){ 
			  return encodeURIComponent(key) + '=' + encodeURIComponent(ctx.obj[key]); 
			}).join('&');
			
			if(action == "GET")
				getvar.push("DalGetOneObject=y")

			getvar.push(str)
		}		
	}
	else{
		if(ctx.obj){
			object = (typeof ctx.obj == "object") ? JSON.stringify(ctx.obj) : ctx.obj;
		}
	}
	
	if(getvar.length > 0){
		if(URL.indexOf("?") < 0)
			URL += "?"
		else if(URL[URL.length-1] != '&')
			URL += "&";

		URL += getvar.join("&");
	}

	return $.ajax({
		method: action,
		dataType: 'json',
		url: URL,
		timeout: timeOut,
		crossDomain: enableCrossSiteTest,
		data: object
	}).done(function (response) {
		if(response && response.sessionkey)
			localStorage.setItem('zySessionKey', response.sessionkey);
		
		if(ctx.fnSuccess){
			ctx.fnSuccess(response);
		}
	}).fail(function (jqXHR, textStatus, errorThrown) {
		if(ctx.fnFailure){
			ctx.fnFailure(jqXHR, textStatus, errorThrown);
		}
	}).always(function (data, textStatus, jqXHR) {  //( data|jqXHR, textStatus, jqXHR|errorThrown ) 
		if(ctx.fnComplete){
			ctx.fnComplete(data, textStatus, jqXHR);
		}
	})
}

/*
Function Name: isValidIpAddress
Description  : check ip is valid
Returns      : 
*/
function isValidIpAddress(address) {

   ipParts = address.split('/');
   if (ipParts.length > 2) return false;
   if (ipParts.length == 2) {
      num = parseInt(ipParts[1]);
      if (num <= 0 || num > 32)
         return false;
   }

   if (ipParts[0] == '0.0.0.0' ||
       ipParts[0] == '255.255.255.255' )
      return false;

   addrParts = ipParts[0].split('.');
   if ( addrParts.length != 4 ) return false;
   for (i = 0; i < 4; i++) {
      if (isNaN(addrParts[i]) || addrParts[i] =="")
         return false;
      num = parseInt(addrParts[i]);
      if ( num < 0 || num > 255 )
         return false;
   }
   return true;
}

/*
*	get current connection informatiom
*
*	@param	[in]	servicesList	network service objecct set, just like http, https, ftp....etc
*
*	@param	[out]	connectInfo		connection information object
*
*	@returns		true			get current connection informatiom successful
*					others			failed
*/
function getCurConnectInfo(connectInfo, servicesList){
	if(null == servicesList){
		console.log("servicesList in getCurConnectInfo is null");
		return false;
	}
	
	var tmpBufV6NoLastBrackets, tmpBufV6Adress, tmpBufV6Port, j;
	var curProtocol = location.protocol.split(":");
	var curPath = document.URL.split("/");
	connectInfo.protocol = curProtocol[0];
	if("http" == connectInfo.protocol){
		connectInfo.otherProtocol = "https";
	}else{
		connectInfo.otherProtocol = "http";
	}
	if( -1 < curPath[2].indexOf("[")){//ipv6
		tmpBufV6NoLastBrackets = curPath[2].split("]");
		tmpBufV6Adress = tmpBufV6NoLastBrackets[0].split("[");
		connectInfo.ipaddress = tmpBufV6Adress[1];
		tmpBufV6Port = tmpBufV6NoLastBrackets[1].split(":");
		connectInfo.isIPv4 = false;
		connectInfo.isIPv6 = true;
		
		if(tmpBufV6Port[1]){//port
			connectInfo.origPort = tmpBufV6Port[1];
		}
		else{
			if(connectInfo.protocol == "http")
				connectInfo.origPort = 80;
			else
				connectInfo.origPort = 443;
		}
	}else{//ipv4 or domain name
		var ipaddr;
		ipaddr = curPath[2].split(":");
		if(true==isValidIpAddress(ipaddr[0])) //url
		{
			connectInfo.isIPv4 = true;
			connectInfo.isIPv6 = false;
		}
		else
		{
			connectInfo.isIPv4 = false;
			connectInfo.isIPv6 = false;
		}
		connectInfo.ipaddress = ipaddr[0];

		if(ipaddr[1]) //port
		{
			connectInfo.origPort = ipaddr[1];
		}
		else
		{
			if(connectInfo.protocol == "http")
				connectInfo.origPort = 80;
			else
				connectInfo.origPort = 443;
		}
	}
	for(j=0; j<servicesList.length; j++){
		if(servicesList[j].Name == curProtocol[0].toUpperCase()){
			connectInfo.protoIndexof = j;
		}
		if(servicesList[j].Name == connectInfo.otherProtocol.toUpperCase()){
			connectInfo.otherProtoIndexof = j;
			connectInfo.otherOrigPort = servicesList[j].Port;
		}
	}
	
	return true;
}

function Ipv4AddrtoInt(ip){
	if(/^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/.test(ip) == false)
		return -1;
	var p = ip.split(".");
	var val = 0, num;
	for(var i=0;i<p.length;i++){
		num = parseInt(p[i]);
		if(num < 0 || num > 255) return -1;
		val += (num << (8*(4-(i+1)))) >>>0;
	}
	return val;
}

function checkDhcpConfig(minIp, maxIp, gwIp, submask) 
{
	var min = Ipv4AddrtoInt(minIp);
	var max = Ipv4AddrtoInt(maxIp);
	var gw = Ipv4AddrtoInt(gwIp);
	var mask = Ipv4AddrtoInt(submask);
	
	/*check mask*/
	var h=0;
	for(var m=0;m<32;m++){
		if(((mask & (1<<(31-m))) >>>0) == 0)
			h=1;
		else if(h) 
			return -4;
	}
	//end
	
	var range_min = (min & mask) >>>0;
	var range_max = (range_min + ~(mask)) >>>0;

	if(!(range_min < min && min < range_max) || !(range_min < max && max < range_max)) 
		return -3;

	if(!(range_min < gw && gw < range_max)) 
		return -2;	
	
	/* The pool can only have one IP address. */
	if(max < min) 
		return -1;	
	
	return 0;
}

/*
Function Name: isValidStatefulIntfId
Description  : check stateful interface ID
Returns      : 
*/
function isValidStatefulIntfId(address) {
   var num;
   addrParts = address.split(':');
   if (addrParts.length < 1 || addrParts.length > 8)
      return false;
   for (i = 0; i < addrParts.length; i++) {
      if(addrParts[i] == "")
         return false;
      if(addrParts[i].length > 4 )
         return false;
      for (var j = 0; j < addrParts[i].length; j++)
      {
         if(((addrParts[i].charAt(j) >= '0') &&
             (addrParts[i].charAt(j) <= '9')) ||
            ((addrParts[i].charAt(j) >= 'a') &&
             (addrParts[i].charAt(j) <= 'f')) ||
            ((addrParts[i].charAt(j) >= 'A') &&
             (addrParts[i].charAt(j) <= 'F')) )
            continue
         return false;
      }
      if ( addrParts[i] != "" )
         num = parseInt(addrParts[i], 16);
      else
         return false;
      if ( num != 0 )
         break;
   }
   return true;
}

/*
Function Name: calNetId
Description  : calculate Net ID
Returns      : Net ID(binary str)
*/
function calNetId(ipAddr, mask){
	var ipAddrInteger = ipStr2Int(ipAddr);
	var ipAddrBin  = ipInt2Bin(ipAddrInteger);
	var maskInteger = ipStr2Int(mask);
	var maskBin  = ipInt2Bin(maskInteger);
	var netId = "";
	var c = 0, ipBit = 0, maskBit = 0;

	for(; c < 32; c++){
		if(ipAddrBin[c] == maskBin[c])
			netId += ipAddrBin[c];
		else
			netId += '0';
	}
	return netId;
}

function ipStr2Int(ipAddr) {
	var split = ipAddr.split( '.', 4 );
	var intVal = (
		parseFloat( split[0] * 16777216 )	/* 2^24 */
	  + parseFloat( split[1] * 65536 )		/* 2^16 */
	  + parseFloat( split[2] * 256 )		/* 2^8  */
	  + parseFloat( split[3] )
	);
	return intVal;
}

function ipInt2Bin(ipInt) {
	var ipBinStr = ipInt.toString( 2 ); 
	var temp = 32 - ipBinStr.length;
	
	if (temp > 0){	
		for(var i = 1; i <= temp; i++)
			ipBinStr = "0" + ipBinStr; 
	} 
	return ipBinStr;
}

function validateEmail(email) {
	var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	return re.test(String(email).toLowerCase());
}

/*!
 *  Get left zero bit position. 
 *
 *  @param[in]   num       Input number.
 *
 *  @return      Left zero bit position.
 *
 *  @note  
*/
function getLeftMostZeroBitPos(num) {
   var i = 0;
   var numArr = [128, 64, 32, 16, 8, 4, 2, 1];

   for ( i = 0; i < numArr.length; i++ )
	  if ( (num & numArr[i]) == 0 )
		 return i;

   return numArr.length;
}

/*!
 *  Get right zero bit position. 
 *
 *  @param[in]   num       Input number.
 *
 *  @return      Right zero bit position.
 *
 *  @note  
*/
function getRightMostOneBitPos(num) {
   var i = 0;
   var numArr = [1, 2, 4, 8, 16, 32, 64, 128];

   for ( i = 0; i < numArr.length; i++ )
	  if ( ((num & numArr[i]) >> i) == 1 )
		 return (numArr.length - i - 1);

   return -1;
}

/*!
 *  Check IPv4 subnet mask is in [255,254,252,248,240,224,192,182,128]. 
 *
 *  @param[in]   address       Input IPv4 subnet mask.
 *
 *  @return     false  -  Not validated IP v4 subnet mask.
 *              true   -  validated IP v4 subnet mask.
 *
 *  @note  
 */
function chkSubnetMask(address) {
	var SNMask = address;
	var SNMaskRanhge=[255,254,252,248,240,224,192,182,128];
	var Valid=0, i, j;
	SNMask = SNMask.replace(/ /g, "");
	var SNMaskSplit = SNMask.split(".");
	if(SNMaskSplit.length != 4) {
		return false;
	}
	for(i = 3; i >= 0; i--){
		if(Valid==0){
			for(j=0;j<SNMaskRanhge.length;j++){
				if(parseInt(SNMaskSplit[i], 10) == SNMaskRanhge[j]) {
					Valid=1;
				}
			}
			if((Valid==0) && (parseInt(SNMaskSplit[i], 10) != 0)) break;
		}else{
			if(parseInt(SNMaskSplit[i], 10) != 255)  {
					Valid=0;
					break;
			}				
		}
		if(isNaN(SNMaskSplit[i])) {
			Valid=0;
			break;
		}
	}
	if(Valid==0){
		return false;					
	}
	return true;
}
/*!
 *  Check if two IP in the same subnet. 
 *
 *  @param[in]   address       Input IPv4 IP address.
 *  @param[in]   mask          Input IPv4 subnet mask.
 *  @param[in]   address       Input IPv4 IP address.
 *  @param[in]   mask          Input IPv4 subnet mask.
 *
 *  @return     false  -  Not in the same subnet.
 *              true   -  In the same subnet.
 *
 *  @note  
 */
function isSameSubNet(lan1Ip, lan1Mask, lan2Ip, lan2Mask) {

   var count = 0;

   lan1a = lan1Ip.split('.');
   lan1m = lan1Mask.split('.');
   lan2a = lan2Ip.split('.');
   lan2m = lan2Mask.split('.');

   for (i = 0; i < 4; i++) {
      l1a_n = parseInt(lan1a[i]);
      l1m_n = parseInt(lan1m[i]);
      l2a_n = parseInt(lan2a[i]);
      l2m_n = parseInt(lan2m[i]);
      if ((l1a_n & l1m_n) == (l2a_n & l2m_n))
         count++;
   }
   if (count == 4)
      return true;
   else
      return false;
}
/*!
 *  Compare 2 IP strings. 
 *
 *  @param[in]   address       Input IPv4 IP address.
 *  @param[in]   address       Input IPv4 IP address.
 *
 *  @return     0 (ip1 = ip2), 1 (ip1 < ip2), 2 (ip1 > ip2).
 *
 *  @note  
 */
function ipCompare(ip1, ip2) {
	var i, ret=0;
	var ipSub1 = ip1.split( '.', 4 );
	var ipSub2 = ip2.split( '.', 4 );
	
	for (i = 0; i < 4; i++) {
		if (parseInt(ipSub1[i]) == parseInt(ipSub2[i])) {
			ret = 0;
			continue;
		} else if (parseInt(ipSub1[i]) < parseInt(ipSub2[i])) {
			ret = 1;
			break;
		} else if (parseInt(ipSub1[i]) > parseInt(ipSub2[i])) {
			ret = 2;
			break;
		}
	}
	return ret;
}

function isHexaDigit(digit) {
   var hexVals = new Array("0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
                           "A", "B", "C", "D", "E", "F", "a", "b", "c", "d", "e", "f");
   var len = hexVals.length;
   var i = 0;
   var ret = false;

   for ( i = 0; i < len; i++ )
      if ( digit == hexVals[i] ) break;

   if ( i < len )
      ret = true;

   return ret;
}

function isValidHexKey(val, size) {
   var ret = false;
   if (val.length == size) {
      for ( i = 0; i < val.length; i++ ) {
         if ( isHexaDigit(val.charAt(i)) == false ) {
            break;
         }
      }
      if ( i == val.length ) {
         ret = true;
      }
   }

   return ret;
}

/*function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}*/
